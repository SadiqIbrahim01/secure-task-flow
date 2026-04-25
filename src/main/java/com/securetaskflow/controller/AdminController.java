package com.securetaskflow.controller;

import com.securetaskflow.dto.response.AdminUserResponse;
import com.securetaskflow.dto.response.AuditLogResponse;
import com.securetaskflow.service.AdminService;
import com.securetaskflow.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(adminService.listAllUsers(pageable));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.getUserById(userId));
    }

    @PutMapping("/users/{userId}/suspend")
    public ResponseEntity<AdminUserResponse> suspendUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(
                adminService.suspendUser(userId, SecurityUtils.getCurrentUserId())
        );
    }

    @PutMapping("/users/{userId}/unsuspend")
    public ResponseEntity<AdminUserResponse> unsuspendUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(
                adminService.unsuspendUser(userId, SecurityUtils.getCurrentUserId())
        );
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(adminService.getAuditLogs(pageable));
    }

    @GetMapping("/audit-logs/actor/{actorId}")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogsByActor(
            @PathVariable UUID actorId,
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(adminService.getAuditLogsByActor(actorId, pageable));
    }
}