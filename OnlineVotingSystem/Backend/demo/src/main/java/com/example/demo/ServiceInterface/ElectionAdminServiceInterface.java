package com.example.demo.ServiceInterface;

import com.example.demo.DTO.ElectionRequest;
import com.example.demo.DTO.ElectionUpdateRequest;
import com.example.demo.Models.ElectionModel;

import java.util.List;
import java.util.UUID;

public interface ElectionAdminServiceInterface {
    ElectionModel createElection(ElectionRequest electionRequest);
    String updateElection(String electionId, ElectionUpdateRequest request);
    void startElection(String electionId);
    void stopElection(String electionId);
    void publishElectionResult(String electionId);
    List<ElectionModel> getActiveElections();
    ElectionModel getElectionById(String electionId);
}
