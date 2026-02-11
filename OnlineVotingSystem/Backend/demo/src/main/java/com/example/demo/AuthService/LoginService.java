package com.example.demo.AuthService;

import com.example.demo.Exception.UnAuthorizedException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class LoginService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final String tokenUrl;
    private final String userInfoUrl;
    private final String clientId;

    public LoginService(
            RestTemplateBuilder builder,
            ObjectMapper objectMapper,
            @Value("${keycloak.base-url}") String baseUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.client-id}") String clientId
    ) {
        this.restTemplate = builder.build();
        this.objectMapper = objectMapper;
        this.clientId = clientId;
        this.tokenUrl = baseUrl + "/realms/" + realm + "/protocol/openid-connect/token";
        this.userInfoUrl = baseUrl + "/realms/" + realm + "/protocol/openid-connect/userinfo";
    }

    public Map<String, Object> login(String username, String password) {
        // Never log password.
        log.info("action=LOGIN_ATTEMPT provider=keycloak username={}", safeUser(username));

        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", clientId);
            params.add("username", username);
            params.add("password", password);
            params.add("scope", "openid");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            Map<String, Object> token = restTemplate.postForObject(
                    tokenUrl,
                    new HttpEntity<>(params, headers),
                    Map.class
            );

            log.info("action=LOGIN_SUCCESS provider=keycloak username={}", safeUser(username));
            return token;

        } catch (HttpStatusCodeException ex) {
            String body = ex.getResponseBodyAsString();
            Map<String, Object> parsed = tryParseJson(body);

            String error = asString(parsed.get("error"));
            String description = asString(parsed.get("error_description"));

            // ✅ THIS is the reason log you want in Grafana:
            log.warn(
                    "action=LOGIN_FAILED provider=keycloak username={} status={} error={} description={}",
                    safeUser(username),
                    ex.getStatusCode().value(),
                    error,
                    description
            );

            // ✅ Throw a 401 domain exception (your handler returns 401)
            String msg = (description != null && !description.isBlank())
                    ? description
                    : "Invalid username or password";

            throw UnAuthorizedException.invalidCredentials(msg);
        }
    }

    public Map<String, Object> getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        ResponseEntity<Map> response = restTemplate.exchange(
                userInfoUrl,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        Map<String, Object> userInfo = response.getBody();

        try {
            Map<String, Object> tokenBody = decodeJwtPayload(accessToken);
            Map<String, Object> realmAccess = (Map<String, Object>) tokenBody.get("realm_access");

            Object rolesObj = realmAccess != null ? realmAccess.get("roles") : List.of();
            userInfo.put("roles", rolesObj);

            log.debug("action=USERINFO_RESOLVED sub={} roles_count={}",
                    asString(tokenBody.get("sub")),
                    (rolesObj instanceof List<?> l) ? l.size() : 0
            );
        } catch (Exception e) {
            userInfo.put("roles", List.of());
        }

        return userInfo;
    }

    private Map<String, Object> decodeJwtPayload(String token) throws Exception {
        String[] parts = token.split("\\.");
        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
        return objectMapper.readValue(payloadJson, new TypeReference<>() {});
    }

    private Map<String, Object> tryParseJson(String body) {
        try {
            if (body == null || body.isBlank()) return Map.of();
            return objectMapper.readValue(body, new TypeReference<>() {});
        } catch (Exception ignored) {
            return Map.of("raw", body);
        }
    }

    private String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private String safeUser(String username) {
        if (username == null) return "null";
        int at = username.indexOf('@');
        if (at > 1) return username.charAt(0) + "***" + username.substring(at);
        return username.length() <= 2 ? "***" : username.substring(0, 2) + "***";
    }
}
