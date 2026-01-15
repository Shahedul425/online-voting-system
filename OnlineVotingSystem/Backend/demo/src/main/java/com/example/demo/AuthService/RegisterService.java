package com.example.demo.AuthService;

import com.example.demo.Enums.Role;
import com.example.demo.Exception.KeycloakEmailAlreadyExistsException;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final RestTemplate restTemplate = new RestTemplate();


    private final UserModelRepository userModelRepository;
    private final OrganizationRepository organizationRepository;
    private final String realm = "OVS-System";
    private final String keycloakUrl = "http://localhost:8081";
    private final String adminClientId = "admin-cli";

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

        return response.get("access_token").toString();
    }
//Will Register User in Applicaiton DB after they register in Keycloak and will use Keycloak Token to check whether user already
//    exist or not?if not then create user. login will be as usual
    public void register(String username,String email, String firstName, String lastName, String password) {

        String adminToken = getAdminToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> user = Map.of(
                "username", username,
                "email", email,
                "firstName", firstName,
                "lastName", lastName,
                "enabled", true,
                "emailVerified", true,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", false
                ))
        );
        ResponseEntity<String> response;
        try{
                response = restTemplate.exchange(
                keycloakUrl + "/admin/realms/" + realm + "/users",
                HttpMethod.POST,
                new HttpEntity<>(user, headers),
                String.class
            );
            String location = response.getHeaders().getFirst("Location");
            String keycloakId = location.substring(location.lastIndexOf("/") + 1);

            assignRole(keycloakId, "voter", adminToken);
            String emailDomain = email.split("@")[1].toLowerCase();
            Optional<OrganizationModel> org = organizationRepository.findByDomain(emailDomain);

            if(org.isEmpty()) {
                throw new RuntimeException("No organization found for email domain: " + emailDomain);
            }

            // --- Create user in your DB immediately ---
            UserModel newUser = new UserModel();
            newUser.setKeycloakId(keycloakId);
            newUser.setEmail(email);
            newUser.setOrganization(org.get());
            newUser.setRole(Role.voter); // or dynamic if needed
            UserModel saved = userModelRepository.save(newUser);
        }catch (HttpClientErrorException e) {

            if (e.getStatusCode() == HttpStatus.CONFLICT && e.getResponseBodyAsString().contains("email")) {
                throw new KeycloakEmailAlreadyExistsException("Email already exists");
            }

            throw e;
        };

        String location = response.getHeaders().getFirst("Location");
        String userId = location.substring(location.lastIndexOf("/") + 1);

        assignRole(userId, "voter", adminToken);
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
}
