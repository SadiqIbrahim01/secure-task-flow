CREATE TABLE users (
                       id              UUID        NOT NULL DEFAULT gen_random_uuid(),
                       email           VARCHAR(255) NOT NULL,
                       password_hash   VARCHAR(255) NOT NULL,
                       first_name      VARCHAR(100) NOT NULL,
                       last_name       VARCHAR(100) NOT NULL,
                       system_role     VARCHAR(50)  NOT NULL DEFAULT 'USER',
                       is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
                       is_suspended    BOOLEAN      NOT NULL DEFAULT FALSE,
                       failed_login_attempts INT   NOT NULL DEFAULT 0,
                       locked_until    TIMESTAMPTZ,
                       created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                       updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                       CONSTRAINT pk_users PRIMARY KEY (id),
                       CONSTRAINT uq_users_email UNIQUE (email),
                       CONSTRAINT chk_users_role CHECK (system_role IN ('USER', 'SUPER_ADMIN'))
);

CREATE INDEX idx_users_email ON users (email);