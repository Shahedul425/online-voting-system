package com.example.demo.Records;

import java.time.Instant;
import java.util.List;

public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        String requestId,
        List<FieldIssue> details
) {
    public record FieldIssue(String field,String issue){}
}
