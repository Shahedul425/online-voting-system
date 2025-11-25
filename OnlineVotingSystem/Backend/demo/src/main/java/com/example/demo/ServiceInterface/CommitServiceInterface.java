package com.example.demo.ServiceInterface;

import com.example.demo.Models.VoteModel;

import java.util.UUID;

public interface CommitServiceInterface {
    VoteModel commitVote(UUID electionId, UUID candidateId, String voteCommitment, String requestId);

}
