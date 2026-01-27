package com.example.demo.ServiceInterface;

import com.example.demo.Service.ReceiptService;

import java.util.UUID;

public interface ReceiptServiceInterface {
    String generateReceiptHash(UUID electionId, String token);
    ReceiptService.ReceiptTokenClaim verifyAndDecode(String receiptToken);
}
