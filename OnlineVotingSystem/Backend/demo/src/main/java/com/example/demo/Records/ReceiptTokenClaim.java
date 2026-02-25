package com.example.demo.Records;

import java.util.UUID;

public record ReceiptTokenClaim(UUID electionId, String receiptToken, long issuedAtEppochSeconds) {}
