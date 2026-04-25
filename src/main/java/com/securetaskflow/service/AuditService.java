package com.securetaskflow.service;

import com.securetaskflow.domain.AuditLog;
import com.securetaskflow.repository.AuditLogRepository;
import com.securetaskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;  // ADD THIS

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(
            UUID actorId,
            String action,
            String resourceType,
            UUID resourceId,
            String oldValue,
            String newValue,
            String ipAddress
    ) {
        try {
            String actorEmail = null;
            if (actorId != null) {
                actorEmail = userRepository.findById(actorId)
                        .map(u -> u.getEmail())
                        .orElse(null);
            }

            AuditLog entry = AuditLog.builder()
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }
}