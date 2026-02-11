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
        name = "receipt_leaf_index",
        uniqueConstraints = @UniqueConstraint(name = "uq_receipt_key_hash",columnNames = {"receipt_key_hash"})
)
public class ReceiptLeafIndexModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false,fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id",nullable = false)
    private ElectionModel election;

    @Column(name = "receipt_key_hash",nullable = false,unique = true,length = 32)
    private byte[] receiptKeyHash;

    @Column(name = "leaf_index",nullable = false)
    private int leafIndex;

    private LocalDateTime votedAt;
}
