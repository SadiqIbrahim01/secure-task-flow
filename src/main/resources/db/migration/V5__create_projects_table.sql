
CREATE TABLE projects (
                          id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                          org_id      UUID        NOT NULL,
                          name        VARCHAR(255) NOT NULL,
                          description TEXT,
                          status      VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
                          created_by  UUID        NOT NULL,
                          created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                          updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                          CONSTRAINT pk_projects PRIMARY KEY (id),
                          CONSTRAINT fk_projects_org
                              FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
                          CONSTRAINT fk_projects_creator
                              FOREIGN KEY (created_by) REFERENCES users(id),
                          CONSTRAINT chk_projects_status
                              CHECK (status IN ('ACTIVE', 'ARCHIVED', 'COMPLETED'))
);

CREATE INDEX idx_projects_org_id ON projects (org_id);