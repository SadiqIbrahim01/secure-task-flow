package com.securetaskflow.dto.request;

import com.securetaskflow.domain.Task.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    private TaskPriority priority = TaskPriority.MEDIUM;

    private UUID assignedToUserId;

    private Instant dueDate;
}