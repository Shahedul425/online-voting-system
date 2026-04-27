package com.example.demo.DAO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;


@Getter
@Setter
public class VoteRequest {

    @NotNull(message = "electionId is required")
    private UUID electionId;

    @NotEmpty(message = "votes must not be empty")
    @Valid
    private List<VoteSelectionRequest> votes;

    // tokenId here is the 6-digit OTP we e-mail to the voter. Kept named
    // `tokenId` for backwards compatibility with VoteCommitService — it
    // looks up OneTokenModel by this field, which is also where we store
    // the 6-digit code now.
    @NotBlank(message = "tokenId is required")
    @Size(min = 6, max = 200, message = "tokenId length must be between 6 and 200")
    private String tokenId;

    // for safe retries
    @Size(max = 100, message = "requestId max length is 100")
    private String requestId;
}