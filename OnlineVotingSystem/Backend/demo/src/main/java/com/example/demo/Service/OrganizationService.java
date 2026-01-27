package com.example.demo.Service;

import com.example.demo.AuthService.RegisterService;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.Role;
import com.example.demo.Exception.*;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.ServiceInterface.OrganizationServiceInterface;
import com.example.demo.Util.Ids;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class OrganizationService implements OrganizationServiceInterface {

    private final OrganizationRepository organizationRepository;
    private final SafeAuditService auditService;
    private final UserInfoService userService;
    private final UserModelRepository userModelRepository;
    private final UserInfoService userInfoService;
    private final RegisterService registerService;

    @Override
    public OrganizationModel findById(String id) {
        UUID orgId = Ids.uuid(id, "organizationId");
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new NotFoundException("ORG_NOT_FOUND", "Organization not found"));
    }

    @Override
    public String addOrganization(OrganizationRequest req) {
        // super-admin actor optional
        UserModel actor = null;
        try { actor = userService.getCurrentUser(); } catch (Exception ignored) {}

        OrganizationModel org = new OrganizationModel();
        org.setName(req.getName());
        org.setCountry(req.getCountry());
        org.setType(req.getType());

        List<String> normalized = req.getAllowedDomains().stream()
                .map(this::normalizeDomainOrThrow)
                .distinct()
                .toList();

        org.setAllowedDomains(normalized);

        try {
            OrganizationModel saved = organizationRepository.save(org);

            auditService.audit(AuditLogsRequest.builder()
                    .actor(actor != null ? actor.getId().toString() : null)
                    .organizationId(saved.getId().toString())
                    .electionId(null)
                    .action(AuditActions.CREATE_ORGANIZATION.name())
                    .status(ActionStatus.SUCCESS.name())
                    .entityId("OrganizationModel")
                    .details("Organization created")
                    .createdAt(LocalDateTime.now())
                    .build());

            return "Organization added successfully";
        } catch (DataIntegrityViolationException e) {
            // domain already taken globally
            auditService.audit(AuditLogsRequest.builder()
                    .actor(actor != null ? actor.getId().toString() : null)
                    .organizationId(null)
                    .electionId(null)
                    .action(AuditActions.CREATE_ORGANIZATION.name())
                    .status(ActionStatus.REJECTED.name())
                    .entityId("OrganizationModel")
                    .details("Organization create failed: domain already exists")
                    .createdAt(LocalDateTime.now())
                    .build());

            throw new ConflictException("DOMAIN_ALREADY_ASSIGNED", "One of the domains is already assigned to another organization");
        }
    }

    private String normalizeDomainOrThrow(String raw) {
        if (raw == null) throw new BadRequestException("INVALID_DOMAIN", "Domain cannot be null");
        String d = raw.trim().toLowerCase();
        if (d.startsWith("@")) d = d.substring(1);

        if (d.isBlank()) throw new BadRequestException("INVALID_DOMAIN", "Domain cannot be blank");
        if (d.contains("://") || d.contains("/") || d.contains(" ")) {
            throw new BadRequestException("INVALID_DOMAIN", "Domain must be like example.com (no http, no paths)");
        }
        if (!d.contains(".")) {
            throw new BadRequestException("INVALID_DOMAIN", "Domain must contain a dot, e.g., example.com");
        }
        return d;
    }

    @Override
    public String updateOrganization(OrganizationRequest organization) {
        throw new BadRequestException("NOT_IMPLEMENTED", "Not implemented yet");
    }

    @Transactional
    public String assignOrgAdmin(String emailRaw, UUID orgId) {
        UserModel actor = userInfoService.getCurrentUser();
        if (actor.getRole() != Role.superadmin) {
            throw new ForbiddenException("FORBIDDEN", "Only super admins can assign org admins");
        }

        String email = emailRaw.trim().toLowerCase();

        UserModel target = (UserModel) userModelRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "No user with this email"));

        String domain = userInfoService.extractDomain(email);

        // Derive org by domain (authoritative)
        OrganizationModel orgByDomain = organizationRepository.findByDomain(domain)
                .orElseThrow(() -> new BadRequestException(
                        "ORG_NOT_ALLOWED",
                        "Email domain is not registered to any organization"
                ));

        // Enforce the requested org matches the domain-derived org
        if (!orgByDomain.getId().equals(orgId)) {
            throw new BadRequestException(
                    "DOMAIN_MISMATCH",
                    "This email belongs to a different organization"
            );
        }

        // Optional extra safety if you keep allowedDomains list
        if (orgByDomain.getAllowedDomains() != null &&
                !orgByDomain.getAllowedDomains().contains(domain)) {
            throw new BadRequestException(
                    "DOMAIN_MISMATCH",
                    "User email domain not allowed for this org"
            );
        }

        // Update DB
        target.setRole(Role.admin);
        target.setOrganization(orgByDomain);
        userModelRepository.save(target);

        // Update Keycloak
        registerService.grantRealmRole(target.getKeycloakId(), "admin");
        registerService.revokeRealmRole(target.getKeycloakId(),"voter");
        // Audit
        auditService.audit(AuditLogsRequest.builder()
                .actor(actor.getId().toString())
                .action(AuditActions.ASSIGN_ORG_ADMIN.name())
                .entityId(target.getId().toString())
                .status(ActionStatus.SUCCESS.name())
                .organizationId(orgByDomain.getId().toString())
                .electionId(null)
                .createdAt(LocalDateTime.now())
                .details("Assigned org admin to " + email)
                .build());
        return "Organization admin added successfully";
    }



}
