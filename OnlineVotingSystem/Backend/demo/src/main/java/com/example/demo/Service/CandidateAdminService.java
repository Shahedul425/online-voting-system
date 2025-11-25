package com.example.demo.Service;
import com.example.demo.ServiceInterface.CandidateAdminServiceInterface;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CandidateAdminService implements CandidateAdminServiceInterface {
    @Override
    public CandidateModel createCandidate() {
        return null;
    }

    @Override
    public CandidateModel updateCandidate() {
        return null;
    }

    @Override
    public void deleteCandidate(UUID electionId) {

    }

    @Override
    public List<CandidateModel> getAllCandidates(UUID electionId) {
        return List.of();
    }
}
