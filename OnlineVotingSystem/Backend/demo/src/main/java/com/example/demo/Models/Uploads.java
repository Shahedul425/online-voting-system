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
public class Uploads {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId")
    private ElectionModel election;
    private String fileType;
    private String fileName;
    @ManyToOne
    @JoinColumn(name = "uploaderId")
    private UserModel uploadedBy;
    private String status;
    private LocalDateTime uploadDate;
}
