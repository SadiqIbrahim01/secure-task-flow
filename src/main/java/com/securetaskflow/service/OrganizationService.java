package com.securetaskflow.service;

import com.securetaskflow.domain.OrgMembership;
import com.securetaskflow.domain.OrgMembership.OrgRole;
import com.securetaskflow.domain.Organization;
import com.securetaskflow.domain.User;
import com.securetaskflow.dto.request.AddMemberRequest;
import com.securetaskflow.dto.request.CreateOrganizationRequest;
import com.securetaskflow.dto.response.MemberResponse;
import com.securetaskflow.dto.response.OrganizationResponse;
import com.securetaskflow.exception.DuplicateResourceException;
import com.securetaskflow.exception.ResourceNotFoundException;
import com.securetaskflow.repository.OrgMembershipRepository;
import com.securetaskflow.repository.OrganizationRepository;
import com.securetaskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public OrganizationResponse create(CreateOrganizationRequest request, UUID actorId) {
        if (organizationRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException(
                    "An organization with slug '" + request.getSlug() + "' already exists"
            );
        }

        User creator = userRepository.getReferenceById(actorId);

        Organization org = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug().toLowerCase())
                .createdBy(creator)
                .build();

        org = organizationRepository.save(org);

        OrgMembership membership = OrgMembership.builder()
                .user(creator)
                .organization(org)
                .orgRole(OrgRole.ORG_OWNER)
                .build();
        orgMembershipRepository.save(membership);

        auditService.log(actorId, null,
                "ORGANIZATION_CREATED", "Organization", org.getId(),
                null, org.getName(), null);

        return toResponse(org);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getById(UUID orgId, UUID actorId) {
        OrgMembership membership = orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return toResponse(membership.getOrganization());
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(UUID orgId, UUID actorId) {
        orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return orgMembershipRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional
    public MemberResponse addMember(UUID orgId, AddMemberRequest request, UUID actorId) {
        log.info("Adding member with email: {} and role: {}", request.getEmail(), request.getRole());

        OrgMembership actorMembership = orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        if (!actorMembership.getOrgRole().canManageMembers()) {
            throw new ResourceNotFoundException("Organization not found");
        }

        Organization org = actorMembership.getOrganization();

        User newMember = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No user found with email: " + request.getEmail()
                ));

        if (orgMembershipRepository.existsByUserIdAndOrganizationId(newMember.getId(), orgId)) {
            throw new DuplicateResourceException("User is already a member of this organization");
        }

        OrgMembership membership = OrgMembership.builder()
                .user(newMember)
                .organization(org)
                .orgRole(request.getRole())   // ← THE FIX: use the request value
                .build();

        membership = orgMembershipRepository.save(membership);

        auditService.log(actorId, null,
                "MEMBER_ADDED", "Organization", orgId,
                null, newMember.getEmail(), null);

        return MemberResponse.builder()
                .userId(newMember.getId())
                .email(newMember.getEmail())
                .firstName(newMember.getFirstName())
                .lastName(newMember.getLastName())
                .role(request.getRole().name())  // use request directly — guaranteed correct
                .joinedAt(membership.getCreatedAt())
                .build();
    }

    @Transactional
    public void removeMember(UUID orgId, UUID targetUserId, UUID actorId) {
        OrgMembership actorMembership = orgMembershipRepository
                .findByUserIdAndOrganizationId(actorId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        if (!actorMembership.getOrgRole().canManageMembers()) {
            throw new ResourceNotFoundException("Organization not found");
        }

        if (targetUserId.equals(actorId)) {
            throw new IllegalArgumentException(
                    "Organization owner cannot remove themselves"
            );
        }

        OrgMembership targetMembership = orgMembershipRepository
                .findByUserIdAndOrganizationId(targetUserId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        orgMembershipRepository.delete(targetMembership);

        auditService.log(actorId, null,
                "MEMBER_REMOVED", "Organization", orgId,
                targetUserId.toString(), null, null);
    }

    private OrganizationResponse toResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .createdByEmail(org.getCreatedBy().getEmail())
                .createdAt(org.getCreatedAt())
                .build();
    }

    private MemberResponse toMemberResponse(OrgMembership m) {
        return MemberResponse.builder()
                .userId(m.getUser().getId())
                .email(m.getUser().getEmail())
                .firstName(m.getUser().getFirstName())
                .lastName(m.getUser().getLastName())
                .role(m.getOrgRole().name())
                .joinedAt(m.getCreatedAt())
                .build();
    }
}