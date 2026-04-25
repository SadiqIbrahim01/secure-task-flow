package com.securetaskflow.service;

import com.securetaskflow.domain.AuditLog;
import com.securetaskflow.domain.User;
import com.securetaskflow.dto.response.AdminUserResponse;
import com.securetaskflow.dto.response.AuditLogResponse;
import com.securetaskflow.exception.ResourceNotFoundException;
import com.securetaskflow.repository.AuditLogRepository;
import com.securetaskflow.repository.RefreshTokenRepository;
import com.securetaskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toAdminUserResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(this::toAdminUserResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public AdminUserResponse suspendUser(UUID targetUserId, UUID actorId) {
        if (targetUserId.equals(actorId)) {
            throw new IllegalArgumentException("You cannot suspend your own account");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (target.getSystemRole() == User.SystemRole.SUPER_ADMIN) {
            throw new IllegalArgumentException("Cannot suspend another SUPER_ADMIN");
        }

        if (target.getIsSuspended()) {
            throw new IllegalArgumentException("User is already suspended");
        }

        target.setIsSuspended(true);

        refreshTokenRepository.revokeAllUserTokens(targetUserId);

        userRepository.save(target);

        log.info("Admin {} suspended user {}", actorId, targetUserId);

        auditService.log(actorId,
                "USER_SUSPENDED", "User", targetUserId,
                "active", "suspended", null);

        return toAdminUserResponse(target);
    }

    @Transactional
    public AdminUserResponse unsuspendUser(UUID targetUserId, UUID actorId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!target.getIsSuspended()) {
            throw new IllegalArgumentException("User is not suspended");
        }

        target.setIsSuspended(false);
        target.setFailedLoginAttempts(0);
        target.setLockedUntil(null);

        userRepository.save(target);

        log.info("Admin {} unsuspended user {}", actorId, targetUserId);

        auditService.log(actorId,
                "USER_UNSUSPENDED", "User", targetUserId,
                "suspended", "active", null);

        return toAdminUserResponse(target);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable)
                .map(this::toAuditLogResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsByActor(UUID actorId, Pageable pageable) {
        return auditLogRepository.findAllByActorId(actorId, pageable)
                .map(this::toAuditLogResponse);
    }

    private AdminUserResponse toAdminUserResponse(User u) {
        return AdminUserResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .systemRole(u.getSystemRole().name())
                .isActive(u.getIsActive())
                .isSuspended(u.getIsSuspended())
                .failedLoginAttempts(u.getFailedLoginAttempts())
                .lockedUntil(u.getLockedUntil())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private AuditLogResponse toAuditLogResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .actorId(a.getActorId())
                .actorEmail(a.getActorEmail())
                .action(a.getAction())
                .resourceType(a.getResourceType())
                .resourceId(a.getResourceId())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt())
                .build();
    }
}