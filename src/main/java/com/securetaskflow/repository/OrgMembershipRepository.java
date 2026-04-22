package com.securetaskflow.repository;

import com.securetaskflow.domain.OrgMembership;
import com.securetaskflow.domain.OrgMembership.OrgRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OrgMembershipRepository extends JpaRepository<OrgMembership, UUID> {

    Optional<OrgMembership> findByUserIdAndOrganizationId(UUID userId, UUID orgId);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID orgId);

    @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM OrgMembership m
        WHERE m.user.id = :userId
          AND m.organization.id = :orgId
          AND m.role = :role
        """)
    boolean existsByUserIdAndOrganizationIdAndRole(
            @Param("userId") UUID userId,
            @Param("orgId") UUID orgId,
            @Param("role") OrgRole role
    );
}