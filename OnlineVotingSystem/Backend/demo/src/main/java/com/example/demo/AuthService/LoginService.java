package com.example.demo.AuthService;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class LoginService {

    private final RestTemplateBuilder restTemplateBuilder;

    public LoginService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplateBuilder = restTemplateBuilder;
    }

    public Map<String,Object> login(String username, String password) {

        String tokenUrl = "http://localhost:8081/realms/OVS-System/protocol/openid-connect/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", "ovs_frontend");
        params.add("username", username);
        params.add("password", password);
        params.add("scope", "openid");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request =
                new HttpEntity<>(params, headers);

        RestTemplate restTemplate = restTemplateBuilder.build();

        return restTemplate.postForObject(tokenUrl, request, Map.class);
    }

    public Map<String, Object> getUserInfo(String accessToken) {

        String url = "http://localhost:8081/realms/OVS-System/protocol/openid-connect/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplateBuilder.build().exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
        );

        Map<String, Object> userInfo = response.getBody();

        try {
            String[] tokenParts = accessToken.split("\\.");
            System.out.println(tokenParts);
            String payload = new String(Base64.getDecoder().decode(tokenParts[1]));
            Map<String, Object> tokenBody = new ObjectMapper().readValue(payload, Map.class);
            System.out.println(tokenBody);
            Map<String, Object> realmAccess = (Map<String, Object>) tokenBody.get("realm_access");
            userInfo.put("roles", realmAccess.get("roles"));
            System.out.println(realmAccess);
        } catch (Exception ex) {
            userInfo.put("roles", List.of());
        }

        return userInfo;
    }
}
