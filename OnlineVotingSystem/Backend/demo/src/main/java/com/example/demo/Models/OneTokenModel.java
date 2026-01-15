package com.example.demo.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
public class OneTokenModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId",nullable = false)
    private ElectionModel election;
    @Column(unique = true, nullable = false)
    @NotBlank
    private String tokenId;
    @ManyToOne
    @JoinColumn(name = "voterId",nullable = false)
    private VoterListModel voter;
    @Column(nullable = false)
    private LocalDateTime issuedAt;
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    private String requestId;
    @Column(nullable = false)
    private boolean isConsumed;
}
