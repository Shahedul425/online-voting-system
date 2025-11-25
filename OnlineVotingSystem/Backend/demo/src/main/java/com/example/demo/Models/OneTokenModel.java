package com.example.demo.Models;

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
public class OneTokenModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId")
    private ElectionModel election;
    @Column(unique = true)
    private String tokenId;
    @ManyToOne
    @JoinColumn(name = "voterId")
    private VoterListModel voter;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String requestId;
    private boolean isConsumed;
}
