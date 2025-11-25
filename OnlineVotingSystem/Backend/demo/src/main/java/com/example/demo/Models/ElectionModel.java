package com.example.demo.Models;

import jakarta.persistence.*;
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
public class ElectionModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String name;
    private String description;
    private String electionType;
    private String status;
//    @Column(unique = true)
//    private String code;
    private String merkleRoot;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime publishedAt;
    @ManyToOne
    @JoinColumn(name = "creatorId")
    private UserModel createdBy;
    @ManyToOne
    @JoinColumn(name = "organizationId")
    private OrganizationModel organization;
}
