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
@Table(name = "voter_upload_staging",
        uniqueConstraints = {
        @UniqueConstraint(name = "uk_job_election_voter", columnNames = {"job_id", "election_id", "voter_id"}),
        @UniqueConstraint(name = "uk_job_election_email", columnNames = {"job_id", "election_id", "email"})
            }
        )
public class VoterUploadStaging {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "election_id", nullable = false)
    private UUID electionId;

    @Column(name = "voter_id", nullable = false)
    private String voterId;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "is_valid")
    private boolean valid;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "line_number")
    private Integer lineNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "importer_id")
    private String importerId;

}
