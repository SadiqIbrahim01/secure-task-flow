package com.securetaskflow.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class TaskResponse {
    private UUID id;
    private UUID projectId;
    private String title;
    private String description;
    private String status;
    private String priority;
    private UUID assignedToUserId;
    private String assignedToEmail;
    private String createdByEmail;
    private Instant dueDate;
    private Instant createdAt;
    private Instant updatedAt;
}