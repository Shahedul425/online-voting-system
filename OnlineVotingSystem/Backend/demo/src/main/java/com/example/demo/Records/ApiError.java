package com.example.demo.Records;

import java.time.Instant;
import java.util.List;

public record ApiError(
        Instant timestamp,
        int status,
        String error,      // e.g. "Bad Request"
        String code,       // e.g. "VALIDATION_FAILED"
        String message,    // main message (human)
        String path,
        String requestId,
        List<FieldIssue> details
) {
    // For validation errors etc.
    public record FieldIssue(
            String field,   // "email"
            String issue,   // "NotBlank" / "Size" / "Pattern" / "type_mismatch"
            String message  // "must not be blank"
    ) {}
}
