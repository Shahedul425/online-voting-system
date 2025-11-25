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
public class CandidateListModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId")
    private ElectionModel election;
    private String firstName;
    private String lastName;
    private String photoUrl;
    private String position;
    private String ballotSerial;
    private LocalDateTime importedAt;
    @ManyToOne
    @JoinColumn(name = "importerId")
    private  UserModel importedBy;
}
