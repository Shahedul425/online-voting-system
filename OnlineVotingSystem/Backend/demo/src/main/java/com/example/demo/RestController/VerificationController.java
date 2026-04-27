package com.example.demo.RestController;

import com.example.demo.DTO.TokenDTO;
import com.example.demo.Service.VerificationService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/voter/verification")
@RequiredArgsConstructor
@Validated
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verify")
    public ResponseEntity<TokenDTO> verifyVoter(
            @RequestParam @NotBlank String voterId,
            @RequestParam @NotBlank String electionId
    ) {
        TokenDTO token = verificationService.verfication(voterId, electionId);
        return ResponseEntity.ok(token);
    }

    /**
     * Email-driven verification — the voter's email comes from the JWT, so the
     * client only has to supply the electionId. This is what the new ballot UI
     * uses; the original /verify endpoint is kept for backwards compatibility
     * with the manual voter-id form.
     */
    @PostMapping("/verifyMe")
    public ResponseEntity<TokenDTO> verifyMe(@RequestParam @NotBlank String electionId) {
        return ResponseEntity.ok(verificationService.verifyByEmail(electionId));
    }
}
