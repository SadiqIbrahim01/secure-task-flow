package com.securetaskflow.repository;

import com.securetaskflow.domain.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // IDOR-safe: always scope task lookup to its project
    @Query("SELECT t FROM Task t WHERE t.id = :id AND t.project.id = :projectId")
    Optional<Task> findByIdAndProjectId(
            @Param("id") UUID id,
            @Param("projectId") UUID projectId
    );

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId")
    Page<Task> findAllByProjectId(
            @Param("projectId") UUID projectId,
            Pageable pageable
    );
}