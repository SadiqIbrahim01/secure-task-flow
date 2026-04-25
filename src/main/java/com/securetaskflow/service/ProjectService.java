package com.securetaskflow.service;

import com.securetaskflow.domain.*;
import com.securetaskflow.domain.ProjectMembership.ProjectRole;
import com.securetaskflow.dto.request.AddProjectMemberRequest;
import com.securetaskflow.dto.request.CreateProjectRequest;
import com.securetaskflow.dto.response.MemberResponse;
import com.securetaskflow.dto.response.ProjectResponse;
import com.securetaskflow.exception.DuplicateResourceException;
import com.securetaskflow.exception.ResourceNotFoundException;
import com.securetaskflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public ProjectResponse create(UUID orgId, CreateProjectRequest request, UUID actorId) {
        OrgMembership orgMembership = orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User creator = userRepository.getReferenceById(actorId);
        Organization org = orgMembership.getOrganization();

        Project project = Project.builder()
                .organization(org)
                .name(request.getName())
                .description(request.getDescription())
                .status(Project.ProjectStatus.ACTIVE)
                .createdBy(creator)
                .build();

        project = projectRepository.save(project);

        ProjectMembership membership = ProjectMembership.builder()
                .user(creator)
                .project(project)
                .role(ProjectRole.PROJECT_OWNER)
                .build();
        projectMembershipRepository.save(membership);

        auditService.log(actorId,"PROJECT_CREATED",
                "Project", project.getId(), null, project.getName(), null);

        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listProjects(UUID orgId, UUID actorId) {
        orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return projectRepository.findAllByOrgIdAndUserId(orgId, actorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getById(UUID orgId, UUID projectId, UUID actorId) {
        orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        Project project = projectRepository
                .findByIdAndOrganizationId(projectId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        return toResponse(project);
    }

    @Transactional
    public MemberResponse addProjectMember(UUID orgId, UUID projectId,
                                           AddProjectMemberRequest request, UUID actorId) {
        ProjectMembership actorMembership = projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!actorMembership.getRole().canManageMembers()) {
            throw new ResourceNotFoundException("Project not found");
        }
        User newMember = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No user found with email: " + request.getEmail()
                ));

        boolean isOrgMember = orgMembershipRepository
                .existsByUserIdAndOrganizationId(newMember.getId(), orgId);

        if (!isOrgMember) {
            throw new ResourceNotFoundException(
                    "User must be an organization member before being added to a project"
            );
        }

        if (projectMembershipRepository.existsByUserIdAndProjectId(newMember.getId(), projectId)) {
            throw new DuplicateResourceException("User is already a member of this project");
        }

        Project project = actorMembership.getProject();

        ProjectMembership membership = ProjectMembership.builder()
                .user(newMember)
                .project(project)
                .role(request.getRole())
                .build();

        projectMembershipRepository.save(membership);

        auditService.log(actorId,"PROJECT_MEMBER_ADDED",
                "Project", projectId, null, newMember.getEmail(), null);

        return MemberResponse.builder()
                .userId(newMember.getId())
                .email(newMember.getEmail())
                .firstName(newMember.getFirstName())
                .lastName(newMember.getLastName())
                .role(request.getRole().name())
                .joinedAt(membership.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteProject(UUID orgId, UUID projectId, UUID actorId) {
        ProjectMembership actorMembership = projectMembershipRepository
                .findByUserIdAndProjectId(actorId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!actorMembership.getRole().canDelete()) {
            throw new ResourceNotFoundException("Project not found");
        }

        Project project = projectRepository
                .findByIdAndOrganizationId(projectId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        projectRepository.delete(project);

        auditService.log(actorId,"PROJECT_DELETED",
                "Project", projectId, project.getName(), null, null);
    }

    private ProjectResponse toResponse(Project p) {
        return ProjectResponse.builder()
                .id(p.getId())
                .orgId(p.getOrganization().getId())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus().name())
                .createdByEmail(p.getCreatedBy().getEmail())
                .createdAt(p.getCreatedAt())
                .build();
    }
}