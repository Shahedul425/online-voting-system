package com.example.demo.Repositories;

import com.example.demo.Models.ReceiptLeafIndexModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReceiptLeafIndexRepository extends JpaRepository<ReceiptLeafIndexModel, UUID> {
    Optional<ReceiptLeafIndexModel> findByReceiptKeyHash(byte[] receiptKeyHash);
}
