package com.example.demo.DTO;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Data
@Builder
public class TokenDTO {
    private String tokenId;
    private LocalDateTime expiryTime;
}
