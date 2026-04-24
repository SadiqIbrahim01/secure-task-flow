package com.securetaskflow.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class OrganizationResponse {
    private UUID id;
    private String name;
    private String slug;
    private String createdByEmail;
    private Instant createdAt;
}