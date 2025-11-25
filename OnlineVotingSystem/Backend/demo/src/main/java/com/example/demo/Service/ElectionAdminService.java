package com.example.demo.Service;
import com.example.demo.Models.ElectionModel;
import com.example.demo.ServiceInterface.ElectionAdminServiceInterface;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ElectionAdminService implements ElectionAdminServiceInterface {
    @Override
    public ElectionModel createElection() {
        return null;
    }

    @Override
    public ElectionModel updateElection() {
        return null;
    }

    @Override
    public void startElection(UUID electionId) {

    }

    @Override
    public void stopElection(UUID electionId) {

    }

    @Override
    public void publishElectionResult(UUID electionId) {

    }

    @Override
    public List<ElectionModel> getActiveElections() {
        return List.of();
    }
}
