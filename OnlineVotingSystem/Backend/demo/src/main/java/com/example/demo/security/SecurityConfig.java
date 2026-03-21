package com.example.demo.security;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.core.annotation.Order;

import java.util.List;

@Profile("!tests")
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    private final JwtConverter jwtConverter;

    public SecurityConfig(JwtConverter jwtConverter) {
        this.jwtConverter = jwtConverter;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtConverter);
        return converter;
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
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var c = new org.springframework.web.cors.CorsConfiguration();

                    c.setAllowedOrigins(List.of(
                            "http://localhost:5173",
                            "http://localhost:80",
                            "https://trustvote.live",
                            "https://www.trustvote.live"
                    ));

                    c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
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
