package com.securetaskflow.controller;

import com.securetaskflow.dto.request.AddMemberRequest;
import com.securetaskflow.dto.request.CreateOrganizationRequest;
import com.securetaskflow.dto.response.MemberResponse;
import com.securetaskflow.dto.response.OrganizationResponse;
import com.securetaskflow.service.OrganizationService;
import com.securetaskflow.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<OrganizationResponse> create(
            @Valid @RequestBody CreateOrganizationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(organizationService.create(request, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<OrganizationResponse> getById(
            @PathVariable UUID orgId) {
        return ResponseEntity.ok(
                organizationService.getById(orgId, SecurityUtils.getCurrentUserId())
        );
    }

    @GetMapping("/{orgId}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(
            @PathVariable UUID orgId) {
        return ResponseEntity.ok(
                organizationService.getMembers(orgId, SecurityUtils.getCurrentUserId())
        );
    }

    @PostMapping("/{orgId}/members")
    public ResponseEntity<MemberResponse> addMember(
            @PathVariable UUID orgId,
            @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(organizationService.addMember(
                        orgId, request, SecurityUtils.getCurrentUserId()
                ));
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID orgId,
            @PathVariable UUID userId) {
        organizationService.removeMember(
                orgId, userId, SecurityUtils.getCurrentUserId()
        );
        return ResponseEntity.noContent().build();
    }
}