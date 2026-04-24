package com.securetaskflow.repository;

import com.securetaskflow.domain.ProjectMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, UUID> {

    @Query("SELECT pm FROM ProjectMembership pm WHERE pm.user.id = :userId AND pm.project.id = :projectId")
    Optional<ProjectMembership> findByUserIdAndProjectId(
            @Param("userId") UUID userId,
            @Param("projectId") UUID projectId
    );

    @Query("SELECT CASE WHEN COUNT(pm) > 0 THEN true ELSE false END FROM ProjectMembership pm WHERE pm.user.id = :userId AND pm.project.id = :projectId")
    boolean existsByUserIdAndProjectId(
            @Param("userId") UUID userId,
            @Param("projectId") UUID projectId
    );

    @Query("SELECT pm FROM ProjectMembership pm WHERE pm.project.id = :projectId")
    List<ProjectMembership> findAllByProjectId(@Param("projectId") UUID projectId);
}