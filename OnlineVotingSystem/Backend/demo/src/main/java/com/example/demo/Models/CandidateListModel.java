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
        uniqueConstraints = @UniqueConstraint(columnNames = {"electionId", "ballotSerial"})
)
public class CandidateListModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "electionId",nullable = false)
    private ElectionModel electionId;
    @NotNull
    @NotBlank
    private String firstName;
    @NotNull
    @NotBlank
    private String lastName;
    private String photoUrl;
    @NotNull
    @NotBlank
    private String position;
    @NotNull
    @NotBlank
    private String ballotSerial;
//    @Column(nullable = false)
    private LocalDateTime importedAt;
    @ManyToOne
    @JoinColumn(name = "importerId",nullable = false)
    private  UserModel importedBy;
}
