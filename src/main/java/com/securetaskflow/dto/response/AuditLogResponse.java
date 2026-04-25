package com.securetaskflow.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AuditLogResponse {
    private UUID id;
    private UUID actorId;
    private String actorEmail;
    private String action;
    private String resourceType;
    private UUID resourceId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private Instant createdAt;
}