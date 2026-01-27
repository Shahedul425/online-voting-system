package com.example.demo.DTO;

import com.example.demo.Enums.Role;
import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        Role role,
        UUID organizationId
) {}