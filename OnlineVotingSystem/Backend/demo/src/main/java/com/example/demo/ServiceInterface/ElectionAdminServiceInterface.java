package com.example.demo.ServiceInterface;

import com.example.demo.Models.ElectionModel;

import java.util.List;
import java.util.UUID;

public interface ElectionAdminServiceInterface {
    ElectionModel createElection();
    ElectionModel updateElection();
    void startElection(UUID electionId);
    void stopElection(UUID electionId);
    void publishElectionResult(UUID electionId);
    List<ElectionModel> getActiveElections();
}
