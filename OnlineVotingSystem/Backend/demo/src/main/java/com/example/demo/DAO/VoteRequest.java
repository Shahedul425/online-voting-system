package com.example.demo.DAO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.UUID;


@Getter
@Setter
public class VoteRequest {

    @NotNull(message = "electionId is required")
    private UUID electionId;

    @NotNull(message = "candidateId is required")
    private UUID candidateId;

    @NotBlank(message = "tokenId is required")
    @Size(min = 10, max = 200, message = "tokenId length must be between 10 and 200")
    private String tokenId;

    // for safe retries
    @Size(max = 100, message = "requestId max length is 100")
    private String requestId;
}