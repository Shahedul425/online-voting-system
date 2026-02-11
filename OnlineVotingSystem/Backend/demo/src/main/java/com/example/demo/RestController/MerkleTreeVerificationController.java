package com.example.demo.RestController;

import com.example.demo.DAO.VerifyReceiptRequest;
import com.example.demo.DTO.VerifyReceiptResponse;
import com.example.demo.Service.MerkleTreeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static net.logstash.logback.argument.StructuredArguments.kv;

@RestController
@RequiredArgsConstructor
@Slf4j
public class MerkleTreeVerificationController {

    private final MerkleTreeService merkleTreeService;

    @PostMapping("/public/receipt/verify")
    public ResponseEntity<VerifyReceiptResponse> verify(@Valid @RequestBody VerifyReceiptRequest body) {

        VerifyReceiptResponse resp = merkleTreeService.verifyReceipt(body.receiptToken());
        return ResponseEntity.ok(resp);
    }
}
