package com.securetaskflow.domain;

import com.securetaskflow.domain.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "org_memberships", indexes = {
        @Index(
                name = "idx_org_membership_user_org",
                columnList = "user_id, org_id",
                unique = true
        )
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgMembership extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private OrgRole orgRole;

    public enum OrgRole {
        ORG_OWNER, ORG_MEMBER;

        public boolean canManageMembers() {
            return this == ORG_OWNER;
        }
    }
}
