package com.example.demo.DAO;

import com.example.demo.Enums.Role;
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
