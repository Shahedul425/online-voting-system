package com.example.demo.DAO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Getter
@Setter
@Component
public class AuditLogsRequest {
    private String id;
    private String actor;
    private String action;
    private String electionId;
//    private String entityType;
    private String entityId;
    private String details;
//    private String requestId;
//    private String ipAddress;
    private LocalDateTime createdAt;
    private String organizationId;
    private String status;
    private String httpStatus;
}
