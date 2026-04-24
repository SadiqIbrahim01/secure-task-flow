package com.securetaskflow.domain;

import com.securetaskflow.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_memberships", indexes = {
        @Index(
                name = "idx_project_memberships_user_project",
                columnList = "user_id, project_id",
                unique = true
        )
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMembership extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProjectRole role;

    public enum ProjectRole {
        PROJECT_OWNER,
        PROJECT_MEMBER,
        PROJECT_VIEWER;

        public boolean canManageMembers() {
            return this == PROJECT_OWNER;
        }

        public boolean canDelete() {
            return this == PROJECT_OWNER;
        }

        public boolean canEdit() {
            return this == PROJECT_OWNER || this == PROJECT_MEMBER;
        }
    }
}
