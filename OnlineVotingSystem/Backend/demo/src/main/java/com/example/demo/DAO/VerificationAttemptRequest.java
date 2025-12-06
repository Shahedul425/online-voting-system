package com.example.demo.DAO;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Data
public class VerificationAttemptRequest {
    private String userId;
    private String voterId;
    private String requestId;
    private String electionId;
    private boolean voterIdVerified;
}
