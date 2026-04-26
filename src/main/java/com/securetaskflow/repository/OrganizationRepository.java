package com.securetaskflow.repository;

import com.securetaskflow.domain.OrgMembership;
import com.securetaskflow.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    boolean existsBySlug(String slug);

    Optional<Organization> findBySlug(String slug);

    @Query("""
    SELECT o FROM Organization o
    JOIN OrgMembership om ON om.organization.id = o.id
    WHERE om.user.id = :userId
    """)
    List<Organization> findAllByUserId(@Param("userId") UUID userId);

}