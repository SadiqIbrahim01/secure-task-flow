package com.securetaskflow.repository;

import com.securetaskflow.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p FROM Project p WHERE p.id = :id AND p.organization.id = :orgId")
    Optional<Project> findByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("orgId") UUID orgId
    );

    @Query("""
        SELECT p FROM Project p
        JOIN ProjectMembership pm ON pm.project.id = p.id
        WHERE p.organization.id = :orgId
          AND pm.user.id = :userId
        """)
    List<Project> findAllByOrgIdAndUserId(
            @Param("orgId") UUID orgId,
            @Param("userId") UUID userId
    );
}