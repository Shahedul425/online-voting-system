package com.example.demo.Models;

import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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
    @ManyToOne(optional = true)
    @JoinColumn(name = "actorId")
    private UserModel actor;
    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(nullable = false)
    private AuditActions action;
    @ManyToOne(optional = true)
    @JoinColumn(name = "electionId")
    private ElectionModel election;
//    private String entityType;
    private String entityId;
    private String details;
//    private String requestId;
    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(nullable = false)
    private ActionStatus status;
//    private String httpStatus;
//    @Column(nullable = false)
    private LocalDateTime createdAt;
    @ManyToOne(optional = true)
    @JoinColumn(name = "organizationId")
    private OrganizationModel organization;
}
