package com.example.demo.DAO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AuditSearchRequest {

    @NotNull(message = "electionId is required")
    private UUID electionId;

    private UUID actorId;
    private String action;
    private String status;

    private LocalDateTime from;
    private LocalDateTime to;

    @Min(value = 0, message = "page must be >= 0")
    private int page = 0;

    @Min(value = 1, message = "size must be >= 1")
    @Max(value = 200, message = "size must be <= 200")
    private int size = 20;

    private String sortBy = "createdAt";

    @Pattern(regexp = "ASC|DESC", message = "direction must be ASC or DESC")
    private String direction = "DESC";
}