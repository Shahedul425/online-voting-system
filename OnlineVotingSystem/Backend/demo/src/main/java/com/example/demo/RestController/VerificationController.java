package com.example.demo.RestController;

import com.example.demo.Service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/verification")
@RequiredArgsConstructor
public class VerificationController {
    private final VerificationService verificationService;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyVoter(@RequestParam String voterId,@RequestParam String electionId){
        verificationService.verfication(voterId,electionId);
        return ResponseEntity.ok().build();
    }
}
