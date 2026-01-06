package com.example.demo.Models;

import com.example.demo.Enums.AuditActions;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogsModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "actorId")
    private UserModel actor;
    @Enumerated(EnumType.STRING)
    private AuditActions action;
    @ManyToOne(optional = true)
    @JoinColumn(name = "electionId")
    private ElectionModel election;
//    private String entityType;
    private String entityId;
    private String details;
//    private String requestId;
    private String status;
//    private String httpStatus;
    private LocalDateTime createdAt;
    @ManyToOne
    @JoinColumn(name = "organizatonId")
    private OrganizationModel organization;
}
