package com.securetaskflow.repository;

import com.securetaskflow.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findAllByActorId(UUID actorId, Pageable pageable);

    Page<AuditLog> findAllByResourceTypeAndResourceId(
            String resourceType, UUID resourceId, Pageable pageable
    );
}