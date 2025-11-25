package com.example.demo.ServiceInterface;

import com.example.demo.Models.VoterListModel;

import java.util.UUID;

public interface VoterImportServiceInterface {
    VoterListModel findByVoterIdAndElectionId(String voterId, UUID electionId);
    boolean exists(String voterId, UUID electionId);
}
