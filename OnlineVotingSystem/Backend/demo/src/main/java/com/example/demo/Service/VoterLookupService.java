package com.example.demo.Service;
import com.example.demo.Models.VoterListModel;
import com.example.demo.ServiceInterface.VoterLookUpServiceInterface;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class VoterLookupService implements VoterLookUpServiceInterface {
    @Override
    public VoterListModel findByVoterIdAndElectionId(String voterId, UUID electionId) {
        return null;
    }

    @Override
    public boolean exists(UUID electionId, String voterId) {
        return false;
    }
}
