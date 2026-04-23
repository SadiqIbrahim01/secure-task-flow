package com.securetaskflow.repository;

import com.securetaskflow.domain.OrgMembership;
import com.securetaskflow.domain.OrgMembership.OrgRole;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;
import java.util.UUID;

public interface OrgMembershipRepository extends JpaRepository<OrgMembership, UUID> {

    Optional<OrgMembership> findByUserIdAndOrganizationId(UUID userId, UUID orgId);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID orgId, OrgRole role);

}