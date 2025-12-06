package com.example.demo.DAO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
public class VoteRequest {
    private String electionId;
    private String candidateId;
    private String voteCommitment;
}
