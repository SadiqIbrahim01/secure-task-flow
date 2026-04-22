package com.securetaskflow.repository;

import com.securetaskflow.domain.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    Optional<Task> findByIdAndProjectId(UUID id, UUID projectId);

    Page<Task> findAllByProjectId(UUID projectId, Pageable pageable);
}