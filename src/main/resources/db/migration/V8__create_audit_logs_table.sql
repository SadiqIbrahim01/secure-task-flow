CREATE TABLE audit_logs (
                            id            UUID        NOT NULL DEFAULT gen_random_uuid(),
                            actor_id      UUID,
                            actor_email   VARCHAR(255),
                            action        VARCHAR(100) NOT NULL,
                            resource_type VARCHAR(100) NOT NULL,
                            resource_id   UUID,
                            old_value     TEXT,
                            new_value     TEXT,
                            ip_address    VARCHAR(45),
                            created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                            CONSTRAINT pk_audit_logs PRIMARY KEY (id)

);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);