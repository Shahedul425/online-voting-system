package com.example.demo.RestController;

import com.example.demo.DTO.TokenDTO;
import com.example.demo.Service.VerificationService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/verification")
@RequiredArgsConstructor
@Validated
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verify")
    public ResponseEntity<TokenDTO> verifyVoter(@RequestParam @NotBlank String voterId,
                                                @RequestParam @NotBlank String electionId) {
        TokenDTO token = verificationService.verfication(voterId, electionId);
        return ResponseEntity.ok(token);
    }
}