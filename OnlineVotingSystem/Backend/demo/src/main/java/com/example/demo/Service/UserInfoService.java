package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.Role;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.security.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserInfoService implements com.example.demo.ServiceInterface.UserInfoService {

    private final UserModelRepository userModelRepository;
    private final OrganizationRepository organizationRepository;
    private final SecurityUtils securityUtils;
    private final SafeAuditService safeAuditService;

    @Override
    @Transactional
    public String findOrCreateUser() {

        String keycloakId = securityUtils.getKeycloakId();
        String email = securityUtils.getEmail();
        List<String> roles = securityUtils.getRealmRoles();

        if (keycloakId == null || email == null) {
            // ✅ security event: missing/invalid jwt
            log.warn("Registration blocked: missing jwt claims {} {}",
                    kv("action", "CREATE_USER"),
                    kv("status", "FAILED")
            );
            throw new ForbiddenException("UNAUTHENTICATED", "Missing or invalid JWT");
        }

        Role systemRole = mapToRole(roles);

        var existing = userModelRepository.findByKeycloakId(keycloakId);
        if (existing.isPresent()) {
            // ✅ reject: already exists (don’t log email)
            log.warn("Registration rejected: user already exists {} {} {}",
                    kv("action", "CREATE_USER"),
                    kv("status", "REJECTED"),
                    kv("keycloakId", keycloakId)
            );
            throw new ConflictException("USER_ALREADY_EXIST", "CAN'T REGISTER USER");
        }

        String domain = extractDomain(email);

        OrganizationModel org = organizationRepository.findByDomain(domain)
                .orElseThrow(() -> {
                    // ✅ security/business block: org not allowed
                    log.warn("Registration blocked: org not allowed {} {} {}",
                            kv("action", "CREATE_USER"),
                            kv("status", "FAILED"),
                            kv("domain", domain)
                    );
                    return new ForbiddenException("ORG_NOT_ALLOWED",
                            "Your email domain is not registered with any organization");
                });

        UserModel newUser = new UserModel();
        newUser.setKeycloakId(keycloakId);
        newUser.setEmail(email.toLowerCase().trim());
        newUser.setRole(systemRole);
        newUser.setOrganization(org);

        UserModel saved = userModelRepository.save(newUser);

        // ✅ audit log (DB) for admins/forensics
        // IMPORTANT: bridge requestId (and traceId if you still keep it) via MDC.
        safeAuditService.audit(AuditLogsRequest.builder()
                .actor(saved.getId().toString())
                .action(AuditActions.CREATE_USER.name())
                .entityId("USER")
                .status(ActionStatus.SUCCESS.name())
                .electionId(null)
                .organizationId(org.getId().toString())
                .requestId(MDC.get("requestId")) // ✅ bridge
                // .traceId(MDC.get("traceId"))   // optional: you said you may comment out later
                .createdAt(LocalDateTime.now())
                .details("User created and assigned to org by domain")
                .build());

        // ✅ No INFO success log (noise)
        return "User created!";
    }

    public String extractDomain(String email) {
        if (email == null) {
            log.warn("Extract domain failed: null email {} {}",
                    kv("action", "EXTRACT_DOMAIN"),
                    kv("status", "FAILED")
            );
            throw new BadRequestException("INVALID_EMAIL", "Invalid email");
        }

        String e = email.trim().toLowerCase();
        int at = e.lastIndexOf("@");
        if (at < 0 || at == e.length() - 1) {
            log.warn("Extract domain failed: invalid email format {} {}",
                    kv("action", "EXTRACT_DOMAIN"),
                    kv("status", "FAILED")
            );
            throw new BadRequestException("INVALID_EMAIL", "Invalid email");
        }
        return e.substring(at + 1);
    }

    private Role mapToRole(List<String> roles) {
        for (String r : roles) {
            if (r.equalsIgnoreCase("super_admin")) return Role.superadmin;
        }
        for (String r : roles) {
            if (r.equalsIgnoreCase("admin")) return Role.admin;
            if (r.equalsIgnoreCase("voter")) return Role.voter;
        }
        return Role.voter;
    }

    public UserModel getByKeyCloakId(String keyCloakId) {
        return userModelRepository.findByKeycloakId(keyCloakId).orElse(null);
    }

    public UserModel getCurrentUser() {
        String kcId = securityUtils.getKeycloakId();

        if (kcId == null || kcId.isBlank()) {
            log.warn("Get current user failed: missing keycloak id {} {}",
                    kv("action", "GET_CURRENT_USER"),
                    kv("status", "FAILED")
            );
            throw new ForbiddenException("UNAUTHENTICATED", "Unauthenticated");
        }

        UserModel user = getByKeyCloakId(kcId);
        if (user == null) {
            // ✅ forensic log (safe)
            log.warn("User not registered {} {} {}",
                    kv("action", "GET_CURRENT_USER"),
                    kv("status", "FAILED"),
                    kv("keycloakId", kcId)
            );
            throw new ForbiddenException("USER_NOT_REGISTERED", "User not registered");
        }

        log.debug("Current user resolved {} {} {}",
                kv("action", "GET_CURRENT_USER"),
                kv("userId", user.getId().toString()),
                kv("role", user.getRole().name())
        );

        return user;
    }
}

