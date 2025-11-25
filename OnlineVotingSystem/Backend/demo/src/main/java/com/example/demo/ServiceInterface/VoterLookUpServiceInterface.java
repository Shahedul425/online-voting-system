package com.example.demo.ServiceInterface;

import com.example.demo.Models.VoterListModel;

import java.util.UUID;

public interface VoterLookUpServiceInterface {
    VoterListModel findByVoterIdAndElectionId(String voterId, UUID electionId);
    boolean exists(UUID electionId, String voterId);
}
