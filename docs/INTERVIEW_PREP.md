1. "Walk me through what happens when a user logs in."

"The login request hits POST /api/v1/auth/login which is explicitly whitelisted as public in both my JWT filter and my SecurityConfig — so it bypasses JWT validation entirely.
The request body is validated first via @Valid — empty email or password fails immediately with a 400 before touching the database.
The AuthController delegates to AuthService.login() which calls Spring Security's AuthenticationManager.authenticate(). This internally calls my CustomUserDetailsService which loads the user by email. If the email doesn't exist, it throws UsernameNotFoundException. If the password doesn't match BCrypt verification, it throws BadCredentialsException. Both produce the same generic 401 response — I never reveal whether the email or password was wrong, because that's information an attacker can use.
If authentication succeeds, Spring Security calls isEnabled() and isAccountNonLocked() on my CustomUserDetails. A suspended user returns false on isEnabled(), throwing DisabledException — also a 401.
On success, I generate a JWT access token valid for 15 minutes and a refresh token valid for 7 days. The refresh token is SHA-256 hashed before being stored in the database — we never store the raw token, same principle as password hashing. The access token is stateless and never stored. Both tokens are returned in the response along with a UserResponse DTO — which deliberately excludes sensitive fields like passwordHash and failedLoginAttempts."


2. "How does your system prevent a user from accessing another user's tasks?"

"Through a pattern I call service-layer IDOR defense — and it operates at multiple levels.
First, I use UUIDs for all resource IDs instead of sequential integers. This prevents enumeration attacks where an attacker increments IDs to discover resources.
Second, every task lookup is scoped to its parent project. My TaskRepository has no plain findById() exposed to the service layer — only findByIdAndProjectId(). So even if an attacker guesses a valid task UUID, the query returns nothing unless that task belongs to the project in the URL. They can't cross project boundaries.
Third, before any data is returned, I verify the requesting user has a membership record in that project. The query checks project_memberships where user_id = authenticatedUserId AND project_id = projectId. No membership means no data.
Fourth — and this is important — when authorization fails, I return 404 Not Found, not 403 Forbidden. A 403 confirms the resource exists. A 404 reveals nothing. An attacker probing for resources they don't own gets the same response whether the resource doesn't exist or they simply can't see it."


3. "If an access token is stolen, what's the worst case and how do you limit it?"

"The worst case is the attacker can impersonate the user for up to 15 minutes — the access token lifetime. They can perform any action that user is authorized for. That's real damage but it's bounded.
I chose 15 minutes deliberately. It's the industry standard balance between security and UX. Shorter windows mean more frequent refreshes which degrades experience. Longer windows extend the attack surface.
The more interesting question is refresh token theft. My refresh tokens are long-lived — 7 days — but I implement rotation. Every time a refresh token is used, it's revoked and a new one is issued. So each refresh token is single-use.
If an attacker steals a refresh token and uses it before the legitimate user does, the legitimate user's next refresh attempt will fail — their token has been marked revoked. That failure signals a possible token theft. My system responds by revoking ALL tokens for that user, forcing a full re-login.
Additionally, I store refresh tokens as SHA-256 hashes. If the database is leaked, attackers get hashes, not usable tokens. And since refresh tokens are high-entropy random values — unlike passwords — SHA-256 is appropriate here rather than BCrypt, because brute-forcing a random 256-bit value is computationally impossible regardless of hash speed."


4. "Why did you choose PostgreSQL over MongoDB?"

"The decision came down to data shape and integrity requirements.
Our data is strongly relational. A Task cannot exist without a Project, a Project cannot exist without an Organization, a ProjectMembership cannot reference a non-existent User. PostgreSQL enforces these relationships with foreign key constraints at the database level — MongoDB gives you no such guarantees. You can insert a comment referencing a task ID that doesn't exist and MongoDB won't complain.
The second reason is transactional integrity. Consider removing a user from an organization — we need to simultaneously remove their project memberships and handle their assigned tasks. In PostgreSQL, that's one ACID transaction. Either everything succeeds or nothing does. MongoDB multi-document transactions exist but add complexity and reduce performance.
The third reason is the audit trail. Audit logs must never be modified or deleted. PostgreSQL's constraint system and transaction model make it straightforward to enforce append-only semantics. We also gain powerful indexing — our audit log has a composite index on resource_type, resource_id that makes compliance queries fast.
MongoDB would have been the right choice if our data were document-shaped — variable structure, nested arrays, no fixed schema. Think product catalogs or content management. Our data is tabular and relational, so PostgreSQL is the correct tool."


5. "You have @PreAuthorize on AdminController AND a rule in SecurityConfig. Why both?"

"This is defense in depth — a core security engineering principle. Never rely on a single control.
The SecurityConfig rule operates at the URL routing level, before the request even reaches a controller. It's enforced by Spring Security's filter chain. If the user doesn't have ROLE_SUPER_ADMIN, the request is rejected immediately.
The @PreAuthorize annotation operates at the method level, enforced by Spring's AOP proxy. It's a completely independent check.
The reason for both is that security configurations can be misconfigured. If someone accidentally changes the URL pattern in SecurityConfig — say, changes /api/v1/admin/** to /api/v1/admin/users/** and forgets the other endpoints — the @PreAuthorize annotation still protects every method in the controller. The annotation is closer to the code it protects.
Think of it like a bank vault. The security guard at the building entrance is your SecurityConfig. The vault door with its own combination is your @PreAuthorize. Even if someone bypasses the guard, they still can't open the vault."


6. "Your AuditService uses @Async and Propagation.REQUIRES_NEW. Explain why both are necessary."

"@Async and REQUIRES_NEW solve two completely different problems.
@Async solves a performance problem. Audit logging involves a database write. Without @Async, that write happens synchronously — the user's request waits for the audit log to complete before getting a response. That adds latency to every single API call. With @Async, the audit write happens on a separate thread from Spring's task executor. The user gets their response immediately, and the audit log is written in the background.
Propagation.REQUIRES_NEW solves a data integrity problem. By default, when a method participates in a transaction and that transaction rolls back, all database writes within it are rolled back too. Without REQUIRES_NEW, if a task creation fails mid-way and the transaction rolls back, the audit log entry for that failed creation would also be rolled back — and we'd have no record that the attempt happened.
REQUIRES_NEW forces the audit log write into its own independent transaction. Even if the calling transaction rolls back entirely, the audit log entry is committed. This is critical for compliance — you need a record of failed attempts, not just successful ones.
Also notice the try-catch inside log(). If the audit write itself fails, we catch the exception and log it — we never let an audit failure propagate and break the user's request. Audit logging must be invisible to the caller."


7. "A junior dev suggests caching user details to avoid the DB call on every request. What's your response?"

"I'd explain the trade-off clearly: they're trading a security guarantee for a performance optimization, and in this case the security guarantee is more valuable.
The reason we hit the database on every request is to enable real-time suspension. If we cache the UserDetails object, a suspended user's token remains valid until the cache expires — which could be minutes. During that window, a suspended user can continue making API calls. The whole point of suspension is immediate effect.
I'd also point out that the DB call is a primary key lookup by UUID on an indexed column. It's extremely fast — sub-millisecond in most cases. It's not the same as a complex query. The performance concern is likely overstated.
If performance genuinely becomes a bottleneck at scale, the right solution is not application-level caching but database connection pooling — which we already have with HikariCP — and potentially read replicas for the user lookup. That preserves the real-time suspension guarantee while improving throughput.
I'd also ask what problem they're actually observing — premature optimization is a common trap. Measure first, optimize if there's a real problem."


8. "What OWASP vulnerabilities does your application defend against and how?"

"I'll go through the ones most relevant to this type of API.
Broken Access Control — defended through service-layer IDOR checks on every resource lookup, hierarchical RBAC with three role tiers, 404 responses for unauthorized access, and UUID-based IDs to prevent enumeration.
Cryptographic Failures — passwords hashed with BCrypt at strength 12, refresh tokens stored as SHA-256 hashes, JWT signed with HMAC-SHA256 using a 256-bit secret generated with openssl rand, no sensitive data in API responses via DTO separation.
Injection — exclusively parameterized queries through JPA's JPQL. There is no string concatenation in any database query in the entire codebase. Spring Data's query derivation also generates parameterized queries.
Insecure Design — addressed through defense in depth at multiple layers, explicit threat modeling during design, and security decisions documented in code comments so future developers understand the reasoning.
Security Misconfiguration — no stack traces in error responses, Spring Security configured explicitly with SessionCreationPolicy.STATELESS, security headers including HSTS, X-Frame-Options, Content-Type-Options, Referrer-Policy, and Permissions-Policy all configured in the filter chain. No default credentials.
Identification and Authentication Failures — generic error messages that don't reveal whether email or password was wrong, account lockout after failed attempts, token revocation on logout and suspension, short-lived access tokens.
Software and Data Integrity Failures — Flyway migrations with checksums prevent unauthorized schema modification, immutable audit logs with append-only semantics and their own independent transaction.
Logging and Monitoring — complete audit trail of every state-changing action, structured logging with SLF4J, request-level logging in the filter chain."