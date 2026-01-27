package com.example.demo.RestController;

import com.example.demo.DAO.VoteRequest;
import com.example.demo.DTO.VoteReceiptResponse;
import com.example.demo.Service.VoteCommitService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/voter/vote")
@RequiredArgsConstructor
@Validated
public class VoteController {

    private final VoteCommitService commitService;

    @PostMapping("/cast")
    public ResponseEntity<VoteReceiptResponse> castBallot(@Valid @RequestBody VoteRequest request) {
        return ResponseEntity.ok(commitService.commitVote(request));
    }
}
