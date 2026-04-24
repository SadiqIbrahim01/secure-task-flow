package com.securetaskflow.dto.request;

import com.securetaskflow.domain.ProjectMembership.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddProjectMemberRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotNull(message = "Role is required")
    private ProjectRole role;
}