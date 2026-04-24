package com.securetaskflow.controller;

import com.securetaskflow.dto.request.CreateTaskRequest;
import com.securetaskflow.dto.request.UpdateTaskRequest;
import com.securetaskflow.dto.request.UpdateTaskStatusRequest;
import com.securetaskflow.dto.response.TaskResponse;
import com.securetaskflow.service.TaskService;
import com.securetaskflow.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(projectId, request, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<Page<TaskResponse>> listTasks(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(
                taskService.listTasks(projectId, SecurityUtils.getCurrentUserId(), pageable)
        );
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(
                taskService.getById(projectId, taskId, SecurityUtils.getCurrentUserId())
        );
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(
                taskService.update(projectId, taskId, request, SecurityUtils.getCurrentUserId())
        );
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        return ResponseEntity.ok(
                taskService.updateStatus(
                        projectId, taskId, request, SecurityUtils.getCurrentUserId()
                )
        );
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId) {
        taskService.delete(projectId, taskId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}