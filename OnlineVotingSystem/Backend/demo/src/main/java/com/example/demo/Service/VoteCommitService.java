package com.example.demo.Service;
import com.example.demo.Models.VoteModel;
import com.example.demo.ServiceInterface.CommitServiceInterface;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class VoteCommitService implements CommitServiceInterface {
    @Override
    public VoteModel commitVote(UUID electionId, UUID candidateId, String voteCommitment, String requestId) {
        return null;
    }
}
