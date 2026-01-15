package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.ServiceInterface.OrganizationServiceInterface;
import com.example.demo.Util.Ids;
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
}
