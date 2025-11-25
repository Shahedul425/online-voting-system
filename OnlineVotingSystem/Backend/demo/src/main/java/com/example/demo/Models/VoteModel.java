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
public class VoteModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId")
    private ElectionModel electionId;
    @ManyToOne
    @JoinColumn(name = "candidateId")
    private CandidateListModel candidateId;
    private String voteCommitment;
//    private String regionCode
    @Column(unique = true)
    private String receiptHashToken;
//    private String requestId;
    private LocalDateTime createdAt;
}
