CREATE TABLE project_memberships (
                                     id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                                     user_id     UUID        NOT NULL,
                                     project_id  UUID        NOT NULL,
                                     role        VARCHAR(50)  NOT NULL,
                                     created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                                     updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                                     CONSTRAINT pk_project_memberships PRIMARY KEY (id),
                                     CONSTRAINT uq_project_memberships_user_project UNIQUE (user_id, project_id),
                                     CONSTRAINT fk_project_memberships_user
                                         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                     CONSTRAINT fk_project_memberships_project
                                         FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                                     CONSTRAINT chk_project_memberships_role
                                         CHECK (role IN ('PROJECT_OWNER', 'PROJECT_MEMBER', 'PROJECT_VIEWER'))
);