package com.example.demo.ServiceInterface;

import java.util.UUID;

public interface VoterStatusInterface {
    boolean canVote(String voterId, UUID electionId);
    void markAsVoted(String voterId, UUID electionId);
    void isBlocked(String voterId, UUID electionId);
    void unblockVoter(String voterId, UUID electionId);
}
