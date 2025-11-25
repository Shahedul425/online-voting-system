package com.example.demo.ServiceInterface;

import com.example.demo.Models.CandidateListModel;

import java.util.List;
import java.util.UUID;

public interface CandidateAdminServiceInterface {
    CandidateListModel createCandidate();
    CandidateListModel updateCandidate();
    void deleteCandidate(UUID electionId);
    List<CandidateListModel> getAllCandidates(UUID electionId);
}
