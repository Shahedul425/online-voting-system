package com.example.demo.DAO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditSearchRequest {

    // REQUIRED
    private String electionId;

    // OPTIONAL FILTERS
    private String actor;
    private String action;
    private String status;

    private LocalDateTime from;
    private LocalDateTime to;

    // PAGINATION
    private int page = 0;
    private int size = 20;

    // SORTING
    private String sortBy = "createdAt";
    private String direction = "DESC";
}
