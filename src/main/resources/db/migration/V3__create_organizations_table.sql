CREATE TABLE organizations (
                               id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                               name        VARCHAR(255) NOT NULL,
                               slug        VARCHAR(100) NOT NULL,
                               created_by  UUID        NOT NULL,
                               created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                               updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                               CONSTRAINT pk_organizations PRIMARY KEY (id),
                               CONSTRAINT uq_organizations_slug UNIQUE (slug),
                               CONSTRAINT fk_organizations_creator
                                   FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_organizations_slug ON organizations (slug);