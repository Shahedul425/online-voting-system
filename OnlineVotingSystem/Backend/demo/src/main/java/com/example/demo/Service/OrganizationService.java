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
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
@Slf4j
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

            // ✅ No INFO “created” log (noise). If you want a single superadmin milestone later,
            // we can add one gated behind a feature flag, but per your request: keep Loki clean.

            auditService.audit(AuditLogsRequest.builder()
                    .actor(actor != null ? actor.getId().toString() : null)
                    .organizationId(saved.getId().toString())
                    .action(AuditActions.CREATE_ORGANIZATION.name())
                    .status(ActionStatus.SUCCESS.name())
                    .entityId("OrganizationModel")
                    .details("Organization created")
                    .build());

            return "Organization added successfully";

        } catch (DataIntegrityViolationException e) {
            // ✅ Rejection => WARN
            log.warn("Create org rejected: domain conflict {} {} {}",
                    kv("action", "CREATE_ORGANIZATION"),
                    kv("status", "REJECTED"),
                    kv("domainCount", normalized != null ? normalized.size() : 0)
            );

            auditService.audit(AuditLogsRequest.builder()
                    .actor(actor != null ? actor.getId().toString() : null)
                    .action(AuditActions.CREATE_ORGANIZATION.name())
                    .status(ActionStatus.REJECTED.name())
                    .entityId("OrganizationModel")
                    .details("Organization create failed: domain already exists")
                    .build());

            throw new ConflictException("DOMAIN_ALREADY_ASSIGNED",
                    "One of the domains is already assigned to another organization");
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

    @Override
    public List<OrganizationModel> allOrganizations() {
        return organizationRepository.findAll();
    }

    @Transactional
    public String assignOrgAdmin(String emailRaw, UUID orgId) {
        UserModel actor = userInfoService.getCurrentUser();

        if (actor.getRole() != Role.superadmin) {
            // ✅ Security/authorization block => WARN
            log.warn("Assign org admin blocked: not superadmin {} {} {}",
                    kv("action", "ASSIGN_ORG_ADMIN"),
                    kv("status", "FAILED"),
                    kv("orgId", orgId.toString())
            );
            throw new ForbiddenException("FORBIDDEN", "Only super admins can assign org admins");
        }

        String email = (emailRaw == null) ? "" : emailRaw.trim().toLowerCase();
        String domain = safeDomain(email);

        UserModel target = (UserModel) userModelRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> {
                    // ✅ Failure => WARN, no raw email
                    log.warn("Assign org admin failed: user not found {} {} {}",
                            kv("action", "ASSIGN_ORG_ADMIN"),
                            kv("status", "FAILED"),
                            kv("domain", domain)
                    );
                    return new NotFoundException("USER_NOT_FOUND", "No user with this email");
                });

        OrganizationModel orgByDomain = organizationRepository.findByDomain(domain)
                .orElseThrow(() -> {
                    // ✅ Rejection => WARN
                    log.warn("Assign org admin rejected: domain not registered {} {} {}",
                            kv("action", "ASSIGN_ORG_ADMIN"),
                            kv("status", "REJECTED"),
                            kv("domain", domain)
                    );
                    return new BadRequestException("ORG_NOT_ALLOWED",
                            "Email domain is not registered to any organization");
                });

        if (!orgByDomain.getId().equals(orgId)) {
            log.warn("Assign org admin rejected: org mismatch {} {} {} {}",
                    kv("action", "ASSIGN_ORG_ADMIN"),
                    kv("status", "REJECTED"),
                    kv("domain", domain),
                    kv("requestedOrgId", orgId.toString())
            );
            throw new BadRequestException("DOMAIN_MISMATCH", "This email belongs to a different organization");
        }

        if (orgByDomain.getAllowedDomains() != null &&
                !orgByDomain.getAllowedDomains().contains(domain)) {
            log.warn("Assign org admin rejected: domain not allowed {} {} {}",
                    kv("action", "ASSIGN_ORG_ADMIN"),
                    kv("status", "REJECTED"),
                    kv("domain", domain)
            );
            throw new BadRequestException("DOMAIN_MISMATCH", "User email domain not allowed for this org");
        }

        // DB updates
        target.setRole(Role.admin);
        target.setOrganization(orgByDomain);
        userModelRepository.save(target);

        // Keycloak updates
        registerService.grantRealmRole(target.getKeycloakId(), "admin");
        registerService.revokeRealmRole(target.getKeycloakId(), "voter");

        // ✅ No INFO “success” log (noise) per your rule.
        // If something fails here, your exception handler + RequestTimingFilter will log it.

        auditService.audit(AuditLogsRequest.builder()
                .actor(actor.getId().toString())
                .action(AuditActions.ASSIGN_ORG_ADMIN.name())
                .entityId(target.getId().toString())
                .status(ActionStatus.SUCCESS.name())
                .organizationId(orgByDomain.getId().toString())
                .details("Assigned org admin (domain=" + domain + ")")
                .build());

        return "Organization admin added successfully";
    }

    private String safeDomain(String email) {
        try {
            return userInfoService.extractDomain(email);
        } catch (Exception e) {
            return "unknown";
        }
    }
}
