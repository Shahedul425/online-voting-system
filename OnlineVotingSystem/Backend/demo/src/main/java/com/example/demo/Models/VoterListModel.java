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
@Table(
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"electionId", "voterId"}),
                @UniqueConstraint(columnNames = {"electionId", "email"}),
        }


)

public class VoterListModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String voterId;
    @ManyToOne
    @JoinColumn(name = "electionId")
    private ElectionModel election;
    private boolean isBlocked;
    private boolean hasVoted;
    private String email;
//    for later like national level production field region-code will be included for analytics for media and parties
//    private String regionCode
    private boolean isVerified;
    private LocalDateTime votedAt;
    private LocalDateTime importedAt;
    @ManyToOne
    @JoinColumn(name = "importerId")
    private UserModel importedBy;
}
