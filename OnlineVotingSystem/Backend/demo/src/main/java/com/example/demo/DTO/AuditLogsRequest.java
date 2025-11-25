package com.example.demo.DTO;

import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;
@Getter
@Setter
@Component
public class AuditLogsRequest {
    private String id;
    private String actor;
    private String action;
    private String electionId;
    private String entityType;
    private String entityId;
    private String details;
    private String requestId;
    private String ipAddress;
    private LocalDateTime createdAt;
    private String organizationId;
}
