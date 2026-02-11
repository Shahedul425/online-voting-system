package com.example.demo.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class VerifyReceiptResponse {
    private boolean included;
    private UUID electionId;
    private String electionName;
    private UUID organizationId;
    private LocalDateTime votedAt;
    private String merkleRootB64;
    private int leafIndex;
    private int treeDepth;
    private List<MerkleProofDTO> proof; // optional: only return when included=true
}
