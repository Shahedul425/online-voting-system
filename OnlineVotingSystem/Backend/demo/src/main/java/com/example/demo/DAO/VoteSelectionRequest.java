package com.example.demo.DAO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class VoteSelectionRequest {

    @NotBlank(message = "position is required")
    private String position;

    @NotNull(message = "candidateId is required")
    private UUID candidateId;
}
