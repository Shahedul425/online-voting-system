package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Drop-in replacement for the existing DTO.
 * CHANGE: adds optional `leafHash` so VoterReceipt.jsx can run a client-side
 * verify-on-load against the Merkle root without a second server round trip.
 *
 * Also dropped the stray `@Service` import (it wasn't needed on a DTO) and
 * added `@NoArgsConstructor` so Jackson can deserialise in both directions.
 */
@Setter
@Getter
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoteReceiptResponse {
    private UUID electionId;
    private String receiptToken;
    private LocalDateTime createdAt;

    /** NEW: hex/base64url-encoded SHA-256 of the receipt token. Nullable. */
    private String leafHash;

    /** Convenience all-args ctor that matches the old 3-arg signature. */
    public VoteReceiptResponse(UUID electionId, String receiptToken, LocalDateTime createdAt) {
        this.electionId = electionId;
        this.receiptToken = receiptToken;
        this.createdAt = createdAt;
    }
}
