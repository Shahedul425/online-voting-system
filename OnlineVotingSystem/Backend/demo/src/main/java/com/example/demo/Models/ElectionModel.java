package com.example.demo.Models;

import com.example.demo.Enums.ElectionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"organizationId", "name"})
)
public class ElectionModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false)
    @NotBlank
    private String name;
    private String description;
    private String electionType;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ElectionStatus status;
//    @Column(unique = true)
//    private String code;
    private String merkleRoot;
    @Column(nullable = false)
    private LocalDateTime startTime;
    @Column(nullable = false)
    private LocalDateTime endTime;
    private LocalDateTime publishedAt;
    private boolean isVoterListUploaded;
    private boolean isCandidateListUploaded;
    @ManyToOne
    @JoinColumn(name = "creatorId",nullable = false)
    private UserModel createdBy;
    @ManyToOne
    @JoinColumn(name = "organizationId",nullable = false)
    private OrganizationModel organization;
//    @Column(nullable = false)
    private LocalDateTime createdAt;
}
