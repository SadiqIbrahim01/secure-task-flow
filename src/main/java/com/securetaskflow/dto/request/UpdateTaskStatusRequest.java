package com.securetaskflow.dto.request;

import com.securetaskflow.domain.Task.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTaskStatusRequest {

    @NotNull(message = "Status is required")
    private TaskStatus status;
}