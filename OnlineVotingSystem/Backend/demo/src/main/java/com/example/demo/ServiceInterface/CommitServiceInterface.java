package com.example.demo.ServiceInterface;

import com.example.demo.Models.VoteModel;

import java.util.UUID;

public interface CommitServiceInterface {
    String commitVote(UUID electionId, UUID candidateId, String tokenId);

}
