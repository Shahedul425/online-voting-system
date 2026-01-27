package com.example.demo.AuthService;

import com.example.demo.DAO.RegisterRequest;
import com.example.demo.DAO.UserRequest;
import com.example.demo.Enums.Role;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.KeycloakEmailAlreadyExistsException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final RestTemplate restTemplate = new RestTemplate();

    private final UserModelRepository userModelRepository;
    private final OrganizationRepository organizationRepository;

    private final String realm = "OVS-System";
    private final String keycloakUrl = "http://localhost:8081";
    private final String adminClientId = "admin-cli";

    public void register(RegisterRequest req) {

        String email = req.email().trim().toLowerCase();
        String domain = extractDomain(email);

        // 1) org domain must exist
        OrganizationModel org = organizationRepository.findByDomain(domain)
                .orElseThrow(() -> new NotFoundException(
                        "ORGANIZATION_NOT_FOUND",
                        "No organization found for email domain: " + domain
                ));

        // 2) prevent duplicates in your DB (fast check)
        if (userModelRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ConflictException("USER_ALREADY_EXISTS", "User already exists with this email");
        }

        String adminToken = getAdminToken();

        // 3) create user in Keycloak
        String keycloakId = createKeycloakUser(req, email, adminToken);

        try {
            // 4) create user in your DB
            UserModel user = new UserModel();
            user.setEmail(email);
            user.setKeycloakId(keycloakId);
            user.setRole(Role.voter); // default
            user.setOrganization(org);

            userModelRepository.save(user);

        } catch (Exception dbEx) {
            // 5) rollback KC user best-effort (avoid orphan KC account)
            tryDeleteKeycloakUser(keycloakId, adminToken);
            throw new ConflictException("USER_CREATE_FAILED", "Could not create user in application database");
        }
    }

    private String createKeycloakUser(RegisterRequest req, String email, String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> user = Map.of(
                "username", email,           // use email as username
                "email", email,
                "firstName", req.firstName(),
                "lastName", req.lastName(),
                "enabled", true,
                "emailVerified", true,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", req.password(),
                        "temporary", false
                ))
        );

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(
                    keycloakUrl + "/admin/realms/" + realm + "/users",
                    HttpMethod.POST,
                    new HttpEntity<>(user, headers),
                    String.class
            );
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                throw new ConflictException("EMAIL_EXISTS", "Email already exists");
            }
            throw e;
        }

        String location = response.getHeaders().getFirst("Location");
        if (location == null || !location.contains("/")) {
            throw new ConflictException("KEYCLOAK_CREATE_FAILED", "Keycloak did not return user id");
        }

        String keycloakId = location.substring(location.lastIndexOf("/") + 1);

        // assign role once
        assignRole(keycloakId, "voter", adminToken);

        return keycloakId;
    }

    public String getAdminToken() {
        String url = keycloakUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", adminClientId);
        form.add("grant_type", "password");
        form.add("username", "admin");
        form.add("password", "admin");

        Map<String, Object> response =
                restTemplate.postForObject(url, new HttpEntity<>(form, headers), Map.class);

        return Objects.requireNonNull(response).get("access_token").toString();
    }

    private void assignRole(String userId, String role, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map roleObj = restTemplate.exchange(
                keycloakUrl + "/admin/realms/" + realm + "/roles/" + role,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        ).getBody();

        restTemplate.exchange(
                keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm",
                HttpMethod.POST,
                new HttpEntity<>(List.of(roleObj), headers),
                String.class
        );
    }

    private void tryDeleteKeycloakUser(String userId, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);

            restTemplate.exchange(
                    keycloakUrl + "/admin/realms/" + realm + "/users/" + userId,
                    HttpMethod.DELETE,
                    new HttpEntity<>(headers),
                    String.class
            );
        } catch (Exception ignored) {
            // best-effort only
        }
    }
    // ===== Expose role operations for other services (SuperAdmin etc.) =====

    public void grantRealmRole(String keycloakUserId, String roleName) {
        String token = getAdminToken();
        assignRole(keycloakUserId, roleName, token);
    }

    public void revokeRealmRole(String keycloakUserId, String roleName) {
        String token = getAdminToken();
        removeRole(keycloakUserId, roleName, token);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void removeRole(String userId, String role, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map roleObj = restTemplate.exchange(
                keycloakUrl + "/admin/realms/" + realm + "/roles/" + role,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        ).getBody();

        if (roleObj == null) {
            throw new ConflictException("ROLE_NOT_FOUND", "Keycloak role not found: " + role);
        }

        restTemplate.exchange(
                keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm",
                HttpMethod.DELETE,
                new HttpEntity<>(List.of(roleObj), headers),
                String.class
        );
    }


    private String extractDomain(String email) {
        int at = email.lastIndexOf("@");
        if (at < 0 || at == email.length() - 1) {
            throw new ConflictException("INVALID_EMAIL", "Invalid email");
        }
        return email.substring(at + 1).toLowerCase();
    }
}