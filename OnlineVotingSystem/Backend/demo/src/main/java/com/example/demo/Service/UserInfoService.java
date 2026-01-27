package com.example.demo.Service;
import com.auth0.jwt.interfaces.DecodedJWT;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
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
            throw new ForbiddenException("UNAUTHENTICATED", "Missing or invalid JWT");
        }

        Role systemRole = mapToRole(roles);

        var existing = userModelRepository.findByKeycloakId(keycloakId);
        if (existing.isPresent()) {
            throw new ConflictException("USER_ALREADY_EXIST","CAN'T REGISTER USER");
//            return "User already exists!";
        }

        String domain = extractDomain(email);

        OrganizationModel org = organizationRepository.findByDomain(domain)
                .orElseThrow(() -> new ForbiddenException("ORG_NOT_ALLOWED",
                        "Your email domain is not registered with any organization"));

        UserModel newUser = new UserModel();
        newUser.setKeycloakId(keycloakId);
        newUser.setEmail(email.toLowerCase().trim());
        newUser.setRole(systemRole);
        newUser.setOrganization(org);

        UserModel saved = userModelRepository.save(newUser);

        safeAuditService.audit(AuditLogsRequest.builder()
                .actor(saved.getId().toString())
                .action(AuditActions.CREATE_USER.name())
                .entityId("USER")
                .status(ActionStatus.SUCCESS.name())
                .electionId(null)
                .organizationId(org.getId().toString())
                .createdAt(LocalDateTime.now())
                .details("User created and assigned to org by domain")
                .build());

        return "User created!";
    }

    public String extractDomain(String email) {
        String e = email.trim().toLowerCase();
        int at = e.lastIndexOf("@");
        if (at < 0 || at == e.length() - 1) {
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

    @Override
    public UserModel getByKeyCloakId(String keyCloakId) {
        return userModelRepository.findByKeycloakId(keyCloakId).orElse(null);
    }

    @Override
    public UserModel getCurrentUser() {
        String kcId = securityUtils.getKeycloakId();
        UserModel user = getByKeyCloakId(kcId);
        if (user == null) throw new ForbiddenException("USER_NOT_REGISTERED", "User not registered");
        return user;
    }
}
