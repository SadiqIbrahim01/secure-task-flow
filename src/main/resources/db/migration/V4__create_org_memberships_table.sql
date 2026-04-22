CREATE TABLE org_memberships (
                                 id          UUID        NOT NULL DEFAULT gen_random_uuid(),
                                 user_id     UUID        NOT NULL,
                                 org_id      UUID        NOT NULL,
                                 role        VARCHAR(50)  NOT NULL,
                                 created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                                 updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                                 CONSTRAINT pk_org_memberships PRIMARY KEY (id),
                                 CONSTRAINT uq_org_memberships_user_org UNIQUE (user_id, org_id),
                                 CONSTRAINT fk_org_memberships_user
                                     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                 CONSTRAINT fk_org_memberships_org
                                     FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
                                 CONSTRAINT chk_org_memberships_role
                                     CHECK (role IN ('ORG_OWNER', 'ORG_MEMBER'))
);