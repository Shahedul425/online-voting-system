package com.example.demo.ServiceInterface;

import com.auth0.jwt.interfaces.DecodedJWT;

import java.util.List;

public interface JwtServiceInterface {
    DecodedJWT decodeJwt(String token);

    String extractEmail(String token);
    String extractKeyCloakId(String token);
    List<String> extractRoles(String token);
}
