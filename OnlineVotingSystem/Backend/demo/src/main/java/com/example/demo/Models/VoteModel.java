package com.example.demo.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
public class VoteModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId" , nullable = false)
    private ElectionModel electionId;
//    @ManyToOne
//    @JoinColumn(name = "candidateId", nullable = false)
//    private CandidateListModel candidateId;
//    Later voteCommitment for advanced cryptography
//    private String voteCommitment;
//    private String regionCode
    @Column(unique = true,nullable = false)
    @NotBlank
    private String receiptHashToken;
//    private String requestId;
    @Column(length = 100, unique = true)
    private String requestId;
    private LocalDateTime createdAt;
}
