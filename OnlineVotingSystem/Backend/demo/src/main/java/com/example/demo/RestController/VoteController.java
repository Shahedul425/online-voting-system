package com.example.demo.RestController;

import com.example.demo.DAO.VoteRequest;
import com.example.demo.DTO.VoteReceiptResponse;
import com.example.demo.Service.VoteCommitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/voter/vote")
@RequiredArgsConstructor
public class VoteController {

    private final VoteCommitService commitService;

    @PostMapping("/cast")
    public ResponseEntity<VoteReceiptResponse> castBallot(@Valid @RequestBody VoteRequest request) {
        // No controller INFO logs (RequestTimingFilter + service WARN + audit DB is enough)
        return ResponseEntity.ok(commitService.commitVote(request));
    }
}
