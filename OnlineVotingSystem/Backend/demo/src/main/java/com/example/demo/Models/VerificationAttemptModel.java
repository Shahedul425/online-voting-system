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
public class VerificationAttemptModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private boolean isEmailVerified;
    @ManyToOne
    @JoinColumn(name = "userId")
    private UserModel user;
    @ManyToOne
    @JoinColumn(name = "voterId")
    private VoterListModel voter;
    private String requestId;
    @ManyToOne
    @JoinColumn(name = "electionId")
    private ElectionModel election;
    private boolean voterIdVerified;
    private LocalDateTime createdAt;
}
