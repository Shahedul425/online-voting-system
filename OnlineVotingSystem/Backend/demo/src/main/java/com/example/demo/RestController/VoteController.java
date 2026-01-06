package com.example.demo.RestController;

import com.example.demo.Service.VoteCommitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/vote")
@RequiredArgsConstructor
public class VoteController {
    private final VoteCommitService commitService;

    @PostMapping("/cast")
    public ResponseEntity<?> castVote(@RequestParam UUID electionId, @RequestParam UUID candidateId,@RequestParam String tokenId) {
        commitService.commitVote(electionId, candidateId, tokenId);
        return ResponseEntity.ok().build();
    }
}
