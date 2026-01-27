package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class VerifyReceiptResponse {
    private boolean included;          // true/false
    private UUID electionId;
    private String electionName;
    private UUID organizationId;
    private String organizationName;
    private LocalDateTime votedAt;
    private String merkleRoot;         // published root
    private List<MerkleProofDTO> proof; // sibling hashes + directions
}
