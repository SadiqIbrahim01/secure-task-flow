package com.securetaskflow.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class ProjectResponse {
    private UUID id;
    private UUID orgId;
    private String name;
    private String description;
    private String status;
    private String createdByEmail;
    private Instant createdAt;
}