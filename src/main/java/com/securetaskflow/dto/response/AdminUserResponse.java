package com.securetaskflow.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AdminUserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String systemRole;
    private boolean isActive;
    private boolean isSuspended;
    private int failedLoginAttempts;
    private Instant lockedUntil;
    private Instant createdAt;
}