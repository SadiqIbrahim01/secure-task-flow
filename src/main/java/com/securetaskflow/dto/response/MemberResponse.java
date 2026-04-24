package com.securetaskflow.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class MemberResponse {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private Instant joinedAt;
}