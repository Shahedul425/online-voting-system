package com.example.demo.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Drop-in replacement for the existing DTO.
 * CHANGE: adds `proofPath` — the shape the warm-trust JSX reads.
 *
 *   proofPath: List<ProofNode> where ProofNode { hash: String, side: "L" | "R" }
 *
 * The legacy `proof` field (List<MerkleProofDTO>) is kept so older callers
 * keep working. The populating service (MerkleTreeService.verifyReceipt)
 * just needs to map `proof` → `proofPath` once; see MerkleTreeServicePatch.md.
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class VerifyReceiptResponse {
    private boolean included;
    private UUID electionId;
    private String electionName;
    private UUID organizationId;
    private LocalDateTime votedAt;
    private String merkleRootB64;
    /** Base64url-encoded SHA-256 of the receipt token — the leaf the prover anchors. */
    private String leafHashB64;
    private int leafIndex;
    private int treeDepth;

    /** Legacy proof shape — kept for backward compat. */
    private List<MerkleProofDTO> proof;

    /** NEW: frontend-friendly shape. List of { hash, side: "L" | "R" }. */
    private List<ProofNode> proofPath;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class ProofNode {
        /** hex-encoded SHA-256 sibling hash (or base64url if you prefer — keep it consistent with merkleRootB64). */
        private String hash;
        /** "L" when sibling is on the left, "R" when on the right. */
        private String side;
    }
}
