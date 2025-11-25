package com.example.demo.Service;
import com.example.demo.ServiceInterface.VoterStatusInterface;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class VoterStatusService implements VoterStatusInterface {
    @Override
    public boolean canVote(String voterId, UUID electionId) {
        return false;
    }

    @Override
    public void markAsVoted(String voterId, UUID electionId) {

    }

    @Override
    public void isBlocked(String voterId, UUID electionId) {

    }

    @Override
    public void unblockVoter(String voterId, UUID electionId) {

    }
}
