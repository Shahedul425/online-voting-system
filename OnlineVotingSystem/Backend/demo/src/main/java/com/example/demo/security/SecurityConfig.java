package com.example.demo.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Profile("!tests")
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtConverter jwtConverter;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    /**
     * Optional: when set, JWKS is fetched from this URL instead of auto-discovered
     * from issuer-uri. Useful when the app reaches Keycloak on a different hostname
     * (e.g. "keycloak:8080" inside Docker) than the browser uses ("localhost:8081").
     */
    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
    private String jwkSetUri;

    public SecurityConfig(JwtConverter jwtConverter) {
        this.jwtConverter = jwtConverter;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtConverter);
        return converter;
    }

    /**
     * Explicit JwtDecoder so (a) the configured issuer & JWKS URL are visible in
     * startup logs, and (b) we can split issuer-validation from JWKS-fetching
     * (important when browser and container see Keycloak at different hostnames).
     *
     * If the iss claim in a token doesn't exactly match {@code issuerUri}, Spring
     * rejects the request with "The iss claim is not valid". Check the token's
     * actual iss (paste at jwt.io) and compare to the issuer logged at startup.
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        log.info("JWT decoder config :: expected issuer = {}", issuerUri);

        NimbusJwtDecoder decoder;
        if (jwkSetUri != null && !jwkSetUri.isBlank()) {
            log.info("JWT decoder config :: JWKS url       = {} (explicit)", jwkSetUri);
            decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        } else {
            log.info("JWT decoder config :: JWKS url       = (auto-discovered from issuer)");
            decoder = (NimbusJwtDecoder) org.springframework.security.oauth2.jwt.JwtDecoders.fromIssuerLocation(issuerUri);
        }

        // Validate iss claim against our CONFIGURED issuer — not whatever Keycloak
        // advertises in metadata. This makes the check deterministic.
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer));

        return decoder;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain actuatorSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/actuator/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration c = new CorsConfiguration();

                    List<String> origins = Arrays.stream(allowedOrigins.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .collect(Collectors.toList());

                    c.setAllowedOrigins(origins);
                    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    c.setAllowedHeaders(List.of("*"));
                    c.setAllowCredentials(true);

                    return c;
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("admin")
                        .requestMatchers("/voter/**").hasRole("voter")
                        .requestMatchers("/superadmin/**").hasRole("superadmin")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );

        return http.build();
    }
}