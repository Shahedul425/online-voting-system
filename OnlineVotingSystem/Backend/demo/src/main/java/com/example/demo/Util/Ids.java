package com.example.demo.Util;

import com.example.demo.Exception.BadRequestException;

import java.util.UUID;

public final class Ids {
    private Ids() {}

    public static UUID uuid(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("MISSING_FIELD", fieldName + " is required");
        }
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("INVALID_UUID", fieldName + " must be a valid UUID");
        }
    }
}