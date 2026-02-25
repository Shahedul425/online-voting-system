package com.example.demo.ServiceInterface;

import com.example.demo.Records.ReceiptTokenClaim;
import com.example.demo.Service.ReceiptService;

import java.util.UUID;

public interface ReceiptServiceInterface {
    String generateReceiptHash(UUID electionId, String token);
    ReceiptTokenClaim verifyAndDecode(String receiptToken);
}
