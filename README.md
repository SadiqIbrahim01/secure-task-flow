# SecureTaskFlow API

A production-grade, security-first project management REST API built with Java and Spring Boot.
Designed to demonstrate clean architecture, role-based access control, and defense against OWASP Top 10 vulnerabilities.


## Overview

SecureTaskFlow is a multi-tenant project management API where users belong to organizations,
projects have members with distinct roles, and every state-changing action is audit-logged.

Key design goals:
- **Security by default** — every endpoint is protected unless explicitly made public
- **Defense in depth** — authorization is enforced at multiple layers, not just the controller
- **Zero trust input** — all incoming data is validated and sanitized before processing
- **Auditability** — full immutable audit trail of who did what and when

---

## Architecture

```
┌─────────────────────────────────────┐
│           Client (Postman)          │
└────────────────┬────────────────────┘
                 │ HTTPS + JWT Bearer
┌────────────────▼────────────────────┐
│      Spring Security Filter Chain   │
│  JWT Auth · Rate Limit · XSS Guard  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│          Controller Layer           │
│   Input validation · HTTP mapping   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│           Service Layer             │
│  Business logic · AuthZ · Auditing  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         Repository Layer            │
│    Spring Data JPA · Param queries  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│           PostgreSQL DB             │
└─────────────────────────────────────┘
```

Clean architecture with strict layer separation.
Each layer communicates only with the layer directly below it.

---

## Security Features

| Feature | Implementation |
|---|---|
| Authentication | JWT (Access + Refresh token rotation) |
| Password hashing | BCrypt (strength 12) |
| Authorization | Role-based (RBAC) + Resource ownership checks |
| IDOR protection | Service-layer membership verification on every resource request |
| SQL Injection | Parameterized queries via Spring Data JPA only |
| XSS prevention | Response headers + input sanitization |
| CSRF protection | Disabled (stateless JWT API) with documented reasoning |
| Brute force | Account lockout after N failed attempts |
| Info leakage | RFC 7807 error format — no stack traces in responses |
| Audit trail | Immutable append-only audit_logs table |
| Token revocation | Refresh tokens stored as hashes, revocable server-side |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 4.0 |
| Security | Spring Security 6 + JJWT |
| Database | PostgreSQL 18 |
| ORM | Spring Data JPA / Hibernate |
| Migrations | Flyway |
| Validation | Jakarta Bean Validation |
| Mapping | MapStruct |
| Testing | JUnit 5 + Postman Collections |
| Build | Maven |

---

## Getting Started

### Prerequisites

- Java 17+
- PostgreSQL 15+
- Maven 3.9+

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/securetaskflow.git
cd securetaskflow
```

### 2. Set up the database

```sql
CREATE DATABASE securetaskflow;
CREATE USER stf_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE securetaskflow TO stf_user;
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) for all required values.

### 4. Run the application

```bash
mvn spring-boot:run
```

The API will start on `http://localhost:8080`.

---

## Environment Variables

Never hardcode secrets. All sensitive configuration is injected via environment variables.

Create a `.env` file (never commit this — it is in `.gitignore`):

```bash
# Database
DB_URL=jdbc:postgresql://localhost:5432/securetaskflow
DB_USERNAME=stf_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_256_bit_secret_key_here_minimum_32_characters
JWT_ACCESS_EXPIRY_MS=900000
JWT_REFRESH_EXPIRY_MS=604800000

# App
APP_PORT=8080
APP_ENV=development
```

See `.env.example` for a complete template with descriptions.

---

## API Reference

Full Postman collection available in `/postman/SecureTaskFlow.postman_collection.json`.

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication Endpoints

```
POST /auth/register     — Register a new user (public)
POST /auth/login        — Login and receive tokens (public)
POST /auth/refresh      — Refresh access token (public)
POST /auth/logout       — Revoke refresh token (authenticated)
```

### Organization Endpoints

```
POST   /organizations                     — Create organization
GET    /organizations/{id}                — Get organization
PUT    /organizations/{id}                — Update organization (ORG_OWNER)
DELETE /organizations/{id}                — Delete organization (ORG_OWNER)
POST   /organizations/{id}/members        — Add member (ORG_OWNER)
DELETE /organizations/{id}/members/{uid}  — Remove member (ORG_OWNER)
```

### Project Endpoints

```
POST   /organizations/{orgId}/projects              — Create project
GET    /organizations/{orgId}/projects              — List projects
GET    /organizations/{orgId}/projects/{projectId}  — Get project
PUT    /organizations/{orgId}/projects/{projectId}  — Update (PROJECT_OWNER)
DELETE /organizations/{orgId}/projects/{projectId}  — Delete (PROJECT_OWNER)
```

### Task Endpoints

```
POST   /projects/{projectId}/tasks             — Create task
GET    /projects/{projectId}/tasks             — List tasks
GET    /projects/{projectId}/tasks/{taskId}    — Get task
PUT    /projects/{projectId}/tasks/{taskId}    — Update task
PATCH  /projects/{projectId}/tasks/{taskId}/status  — Update status
DELETE /projects/{projectId}/tasks/{taskId}    — Delete (PROJECT_OWNER)
```

### Admin Endpoints (SUPER_ADMIN only)

```
GET  /admin/users              — List all users (paginated)
PUT  /admin/users/{id}/suspend — Suspend a user
GET  /admin/audit-logs         — Full audit trail
```

---

## Role & Permission Matrix

| Action | SUPER_ADMIN | ORG_OWNER | PROJECT_OWNER | PROJECT_MEMBER | PROJECT_VIEWER |
|---|:---:|:---:|:---:|:---:|:---:|
| Suspend users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage org members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete projects | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| View tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Project Structure

```
src/
├── main/
│   ├── java/com/securetaskflow/
│   │   ├── config/          # Security, JPA, app config
│   │   ├── controller/      # REST controllers (HTTP layer only)
│   │   ├── service/         # Business logic + authorization
│   │   ├── repository/      # Data access layer
│   │   ├── domain/          # JPA entities
│   │   ├── dto/             # Request/Response objects
│   │   ├── mapper/          # MapStruct mappers
│   │   ├── security/        # JWT, filters, user details
│   │   ├── exception/       # Global exception handling
│   │   ├── audit/           # Audit logging infrastructure
│   │   └── util/            # Shared utilities
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       └── db/migration/    # Flyway SQL migrations
└── test/
    └── java/com/securetaskflow/
```

---

## Running Tests

```bash
# Unit tests only
mvn test

# All tests with coverage report
mvn verify
```

Postman collection in `/postman/` contains end-to-end API tests with environment setup.

---

## Security Considerations

This project is built with security-first thinking at every layer:

- No raw SQL strings — only parameterized queries via JPA
- No hardcoded credentials — all secrets via environment variables
- No stack traces in HTTP responses — RFC 7807 error format only
- No sequential integer IDs — UUIDs throughout to prevent enumeration
- Resource ownership is verified at the **service layer**, not just the controller
- Returning `404` (not `403`) when a user accesses a resource they don't own — prevents confirming resource existence

---

## License

MIT License — see `LICENSE` for details.

---

*Built as a portfolio project demonstrating production-grade Spring Boot development
with a strong focus on application security and clean architecture.*