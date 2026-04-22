CREATE TABLE tasks (
                       id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                       project_id  UUID        NOT NULL,
                       title       VARCHAR(255) NOT NULL,
                       description TEXT,
                       status      VARCHAR(50)  NOT NULL DEFAULT 'TODO',
                       priority    VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
                       assigned_to UUID,
                       created_by  UUID        NOT NULL,
                       due_date    TIMESTAMPTZ,
                       created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                       updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                       CONSTRAINT pk_tasks PRIMARY KEY (id),
                       CONSTRAINT fk_tasks_project
                           FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                       CONSTRAINT fk_tasks_assignee
                           FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                       CONSTRAINT fk_tasks_creator
                           FOREIGN KEY (created_by) REFERENCES users(id),
                       CONSTRAINT chk_tasks_status
                           CHECK (status IN ('TODO','IN_PROGRESS','IN_REVIEW','DONE','CANCELLED')),
                       CONSTRAINT chk_tasks_priority
                           CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);

CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);