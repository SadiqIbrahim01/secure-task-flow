package com.securetaskflow.controller;

import com.securetaskflow.dto.request.AddProjectMemberRequest;
import com.securetaskflow.dto.request.CreateProjectRequest;
import com.securetaskflow.dto.response.MemberResponse;
import com.securetaskflow.dto.response.ProjectResponse;
import com.securetaskflow.service.ProjectService;
import com.securetaskflow.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(orgId, request, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> listProjects(
            @PathVariable UUID orgId) {
        return ResponseEntity.ok(
                projectService.listProjects(orgId, SecurityUtils.getCurrentUserId())
        );
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getById(
            @PathVariable UUID orgId,
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(
                projectService.getById(orgId, projectId, SecurityUtils.getCurrentUserId())
        );
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<MemberResponse>> getProjectMembers(
            @PathVariable UUID orgId,
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(
                projectService.getProjectMembers(orgId, projectId, SecurityUtils.getCurrentUserId())
        );
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<MemberResponse> addMember(
            @PathVariable UUID orgId,
            @PathVariable UUID projectId,
            @Valid @RequestBody AddProjectMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addProjectMember(
                        orgId, projectId, request, SecurityUtils.getCurrentUserId()
                ));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID projectId) {
        projectService.deleteProject(orgId, projectId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}