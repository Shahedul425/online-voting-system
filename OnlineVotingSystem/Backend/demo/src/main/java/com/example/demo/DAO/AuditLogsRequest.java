package com.example.demo.DAO;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;


@Builder
@Data
public class AuditLogsRequest {
//    private String id;
    private String actor;
    private String action;
    private String electionId;
//    private String entityType;
    private String entityId;
    private String details;
    private String requestId;
    private String traceId;
    private LocalDateTime createdAt;
    private String organizationId;
    private String status;
    private String httpStatus;
}
