package com.example.demo.ServiceInterface;

import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.VoterListModel;

import java.util.List;

public interface ElectionAdminServiceInterface {
    ElectionModel createElection(ElectionRequest electionRequest);
    String updateElection(String electionId, ElectionUpdateRequest request);
    void startElection(String electionId);
    void stopElection(String electionId);
    void publishElectionResult(String electionId);
    void closeElection(String electionId);
    List<ElectionModel> getActiveElections(String id);
    List<CandidateListModel> getCandidateList(String id);
    List<ElectionModel> getElectionByStatus(String status);
    List<VoterListModel> getVoterList(String id);
    ElectionModel getElectionById(String electionId);
    Long totalVoters(String id);
    Long totalCandidates(String id);
    List<ElectionModel> getAllElections(String id);
}
