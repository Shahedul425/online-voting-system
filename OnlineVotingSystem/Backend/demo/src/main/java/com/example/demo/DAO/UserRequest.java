package com.example.demo.DAO;

import com.example.demo.Enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Getter
@Setter
public class UserRequest {

    @NotBlank(message = "email is required")
    @Email(message = "email is invalid")
    @Size(max = 320, message = "email max length is 320")
    private String email;

    @NotBlank(message = "keycloakId is required")
    @Size(max = 100, message = "keycloakId max length is 100")
    private String keycloakId;

    @NotNull(message = "role is required")
    private Role role;

    @NotNull(message = "organizationId is required")
    private UUID organizationId;
}