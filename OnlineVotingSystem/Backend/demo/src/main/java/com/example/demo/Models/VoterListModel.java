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
    @NotBlank
    @Column(nullable = false)
    private String voterId;
    @ManyToOne(optional = false)
    @JoinColumn(name = "electionId",nullable = false)
    @NotNull
    private ElectionModel election;
    private boolean isBlocked;
    private boolean hasVoted;
    @Column(nullable=false, length=320)
    @NotNull
    @NotBlank
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
