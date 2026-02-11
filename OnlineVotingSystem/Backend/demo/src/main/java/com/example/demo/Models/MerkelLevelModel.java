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
        name = "merkle_level",
        uniqueConstraints = @UniqueConstraint(name = "uq_merkle_level",columnNames = {"election_id","level"})
)
public class MerkelLevelModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false,fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id",nullable = false)
    private ElectionModel election;

    @Column(name = "level",nullable = false)
    private int level;

    @Column(name = "node_count",nullable = false)
    private int nodeCount;

    @Lob
    @Column(name = "hash_blob",nullable = false)
    private byte[] hashBlob;
    private LocalDateTime createdAt;
}
