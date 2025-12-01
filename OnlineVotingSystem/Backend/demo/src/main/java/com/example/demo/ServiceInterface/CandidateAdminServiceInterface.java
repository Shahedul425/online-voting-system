package com.example.demo.ServiceInterface;

//import com.example.demo.DTO.CandidateRequest;
import com.example.demo.Models.CandidateListModel;

import java.util.List;
import java.util.UUID;

public interface CandidateAdminServiceInterface {
    List<CandidateListModel> getAllCandidates(UUID electionId);
//    String bulkImportCandidates(CandidateRequest candidateRequest);
}
