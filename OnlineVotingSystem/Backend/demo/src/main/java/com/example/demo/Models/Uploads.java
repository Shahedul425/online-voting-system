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
public class Uploads {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "electionId",nullable = false)
    private ElectionModel election;
    @Column(nullable = false)
    @NotBlank
    private String fileType;
    @Column(nullable = false)
    @NotBlank
    private String fileName;
    @ManyToOne
    @JoinColumn(name = "uploaderId",nullable = false)
    private UserModel uploadedBy;
    @NotBlank
    @Column(nullable = false)
    private String status;
//    @Column(nullable = false)
    private LocalDateTime uploadDate;
}
