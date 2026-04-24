package com.securetaskflow.repository;

import com.securetaskflow.domain.OrgMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgMembershipRepository extends JpaRepository<OrgMembership, UUID> {

    @Query("SELECT om FROM OrgMembership om WHERE om.user.id = :userId AND om.organization.id = :orgId")
    Optional<OrgMembership> findByUserIdAndOrganizationId(
            @Param("userId") UUID userId,
            @Param("orgId") UUID orgId
    );

    @Query("SELECT CASE WHEN COUNT(om) > 0 THEN true ELSE false END FROM OrgMembership om WHERE om.user.id = :userId AND om.organization.id = :orgId")
    boolean existsByUserIdAndOrganizationId(
            @Param("userId") UUID userId,
            @Param("orgId") UUID orgId
    );

    @Query("SELECT om FROM OrgMembership om WHERE om.organization.id = :orgId")
    List<OrgMembership> findAllByOrganizationId(@Param("orgId") UUID orgId);
}