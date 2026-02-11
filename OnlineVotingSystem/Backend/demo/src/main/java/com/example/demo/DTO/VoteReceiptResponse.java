package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Setter
@Getter
@AllArgsConstructor
@Data
public class VoteReceiptResponse {
    private UUID electionId;
    private String receiptToken;
    private LocalDateTime createdAt;

}
