package com.example.demo.DAO;

import com.example.demo.Enums.Role;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lightweight projection of a {@link com.example.demo.Models.UserModel} for the
 * superadmin "list admins" view. Deliberately omits the Keycloak ID and any
 * other internal identifiers that the frontend has no business knowing about.
 *
 * Returned by {@code GET /superadmin/admins}.
 */
public record AdminListItem(
        UUID id,
        String email,
        Role role,
        LocalDateTime createdAt,
        UUID organizationId,
        String organizationName
) {}
