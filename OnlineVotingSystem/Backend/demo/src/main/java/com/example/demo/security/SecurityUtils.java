package com.example.demo.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public final class SecurityUtils {

    private SecurityUtils() {}

    public Jwt getJwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return null;
        }
        return (Jwt) auth.getPrincipal();
    }
    public String getKeycloakId() {
        Jwt jwt = getJwt();
        return jwt != null ? jwt.getSubject() : null;
    }

    public String getEmail() {
        Jwt jwt = getJwt();
        return jwt != null ? jwt.getClaim("email") : null;
    }

    @SuppressWarnings("unchecked")
    public List<String> getRealmRoles() {
        Jwt jwt = getJwt();
        if (jwt == null) return Collections.emptyList();

        Object realmAccessObj = jwt.getClaim("realm_access");
        if (realmAccessObj instanceof Map<?, ?> map && map.containsKey("roles")) {
            Object rolesObj = map.get("roles");
            if (rolesObj instanceof List<?> list) {
                return list.stream().map(Object::toString).toList();
            }
        }

        return Collections.emptyList();
    }
}