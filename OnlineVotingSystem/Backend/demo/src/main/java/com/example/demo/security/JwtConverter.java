package com.example.demo.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class JwtConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final Set<String> validRoles = Set.of("admin", "voter");

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new HashSet<>();
        Map<String, Object> claims = jwt.getClaim("realm_access");

        System.out.println("🔍 RAW JWT CLAIMS: " + jwt.getClaims());

        if (claims != null && claims.containsKey("roles")) {
            List<String> roles = (List<String>) claims.get("roles");
            System.out.println("🎭 Roles from Keycloak: " + roles);

            roles.stream()
                    .filter(validRoles::contains)
                    .forEach(role -> {
                        System.out.println("✅ Mapped role: ROLE_" + role);
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                    });
        }

        System.out.println("✅ Final authorities: " + authorities);
        return authorities;
    }
}
