// src/main/java/com/securetaskflow/service/TaskService.java
package com.securetaskflow.service;

import com.securetaskflow.domain.*;
import com.securetaskflow.domain.ProjectMembership.ProjectRole;
import com.securetaskflow.dto.request.CreateTaskRequest;
import com.securetaskflow.dto.request.UpdateTaskRequest;
import com.securetaskflow.dto.request.UpdateTaskStatusRequest;
import com.securetaskflow.dto.response.TaskResponse;
import com.securetaskflow.exception.ResourceNotFoundException;
import com.securetaskflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public TaskResponse create(UUID projectId, CreateTaskRequest request, UUID actorId) {
        ProjectMembership membership = projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!membership.getRole().canEdit()) {
            throw new ResourceNotFoundException("Project not found");
        }

        Project project = membership.getProject();
        User creator = userRepository.getReferenceById(actorId);
        User assignee = null;
        if (request.getAssignedToUserId() != null) {
            assignee = resolveAssignee(request.getAssignedToUserId(), projectId);
        }

        Task task = Task.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(Task.TaskStatus.TODO)
                .priority(request.getPriority() != null
                        ? request.getPriority() : Task.TaskPriority.MEDIUM)
                .assignedTo(assignee)
                .createdBy(creator)
                .dueDate(request.getDueDate())
                .build();

        task = taskRepository.save(task);

        auditService.log(actorId,"TASK_CREATED",
                "Task", task.getId(), null, task.getTitle(), null);

        return toResponse(task);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> listTasks(UUID projectId, UUID actorId, Pageable pageable) {
        projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        return taskRepository.findAllByProjectId(projectId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(UUID projectId, UUID taskId, UUID actorId) {
        projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        Task task = taskRepository
                .findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(UUID projectId, UUID taskId,
                               UpdateTaskRequest request, UUID actorId) {
        ProjectMembership membership = projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Task task = taskRepository
                .findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (membership.getRole() != ProjectRole.PROJECT_OWNER
                && !task.isOwnedBy(userRepository.getReferenceById(actorId))) {
            throw new ResourceNotFoundException("Task not found");
        }

        String oldTitle = task.getTitle();

        if (request.getTitle() != null)       task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null)    task.setPriority(request.getPriority());
        if (request.getDueDate() != null)     task.setDueDate(request.getDueDate());

        if (request.getAssignedToUserId() != null) {
            User assignee = resolveAssignee(request.getAssignedToUserId(), projectId);
            task.setAssignedTo(assignee);
        }

        task = taskRepository.save(task);

        auditService.log(actorId,"TASK_UPDATED",
                "Task", taskId, oldTitle, task.getTitle(), null);

        return toResponse(task);
    }

    @Transactional
    public TaskResponse updateStatus(UUID projectId, UUID taskId,
                                     UpdateTaskStatusRequest request, UUID actorId) {
        ProjectMembership membership = projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!membership.getRole().canEdit()) {
            throw new ResourceNotFoundException("Task not found");
        }

        Task task = taskRepository
                .findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (membership.getRole() == ProjectRole.PROJECT_MEMBER
                && !task.isOwnedBy(userRepository.getReferenceById(actorId))) {
            throw new ResourceNotFoundException("Task not found");
        }

        String oldStatus = task.getStatus().name();
        task.setStatus(request.getStatus());
        task = taskRepository.save(task);

        auditService.log(actorId,"TASK_STATUS_UPDATED",
                "Task", taskId, oldStatus, request.getStatus().name(), null);

        return toResponse(task);
    }

    @Transactional
    public void delete(UUID projectId, UUID taskId, UUID actorId) {
        ProjectMembership membership = projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!membership.getRole().canDelete()) {
            throw new ResourceNotFoundException("Task not found");
        }

        Task task = taskRepository
                .findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        taskRepository.delete(task);

        auditService.log(actorId,"TASK_DELETED",
                "Task", taskId, task.getTitle(), null, null);
    }

    private User resolveAssignee(UUID userId, UUID projectId) {
        if (!projectMembershipRepository.existsByUserIdAndProjectId(userId, projectId)) {
            throw new ResourceNotFoundException(
                    "Assigned user is not a member of this project"
            );
        }
        return userRepository.getReferenceById(userId);
    }

    private TaskResponse toResponse(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .projectId(t.getProject().getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus().name())
                .priority(t.getPriority().name())
                .assignedToUserId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
                .assignedToEmail(t.getAssignedTo() != null ? t.getAssignedTo().getEmail() : null)
                .createdByEmail(t.getCreatedBy().getEmail())
                .dueDate(t.getDueDate())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}