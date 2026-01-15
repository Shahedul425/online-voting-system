package com.example.demo.RestController;

import com.example.demo.Service.VoteCommitService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/vote")
@RequiredArgsConstructor
@Validated
public class VoteController {

    private final VoteCommitService commitService;

    @PostMapping("/cast")
    public ResponseEntity<String> castVote(@RequestParam @NotNull UUID electionId,
                                           @RequestParam @NotNull UUID candidateId,
                                           @RequestParam @NotBlank String tokenId) {
        String receipt = commitService.commitVote(electionId, candidateId, tokenId);
        return ResponseEntity.ok(receipt);
    }
}
