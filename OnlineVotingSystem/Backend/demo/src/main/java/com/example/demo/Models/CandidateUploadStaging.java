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
public class CandidateUploadStaging {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "job_id", nullable = false)
    private UUID jobId;
    @Column(name = "election_id", nullable = false)
    private UUID electionId;
    @Column(nullable = false)
    private String firstName;
    @Column(nullable = false)
    private String lastName;
    @Column(nullable = false)
    private String party;
    @Column(nullable = false)
    private String position;
    @Column(nullable = false)
    private String ballotSerial;
    @Column(nullable = false)
    private String photoUrl;

    private LocalDateTime createdAt;
    private String importerId;
    private Integer lineNumber;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;
    @Column(name = "is_valid")
    private boolean valid;


}
