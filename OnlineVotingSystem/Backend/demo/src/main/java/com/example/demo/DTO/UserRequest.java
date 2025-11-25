package com.example.demo.DTO;

import com.example.demo.Enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
@Getter
@Setter
@Component
public class UserRequest {
    private String email;
    private String keycloakId;
    private Role role;
    private String organizationId;
}
