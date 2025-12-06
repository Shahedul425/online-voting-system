package com.example.demo.Service;
import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.ServiceInterface.ElectionAdminServiceInterface;
import com.example.demo.ServiceInterface.UserInfoService;
import com.example.demo.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ElectionAdminService implements ElectionAdminServiceInterface {
    private final UserInfoService userInfoService;
    private final SecurityUtils securityUtils;
    private final OrganizationService organizationService;
    private final ElectionModelRepository electionModelRepository;
    @Override
    public ElectionModel createElection(ElectionRequest electionRequest) {
        UserModel admin = userInfoService.getCurrentUser();
        OrganizationModel organization = organizationService.findById(String.valueOf(admin.getOrganization().getId()));
        if (organization == null) {
            return null;
//            Runtime Error later implementation to do
        }
        ElectionModel election = new ElectionModel();
        election.setOrganization(organization);
        election.setElectionType(electionRequest.getElectionType());
        election.setDescription(electionRequest.getDescription());
        election.setName(electionRequest.getName());
        election.setCreatedBy(admin);
        election.setStartTime(electionRequest.getStartTime());
        election.setEndTime(electionRequest.getEndTime());
        election.setStatus(ElectionStatus.draft);
        election.setCreatedAt(LocalDateTime.now());
        electionModelRepository.save(election);
//        Audit Log to do
        return election;
    }

    @Override
    public String updateElection(String electionId, ElectionUpdateRequest request) {
        ElectionModel election = getElectionById(electionId);
        if (election == null) {
            return null;
//            Exception to do
        }
        if(election.getStatus() != ElectionStatus.draft) {
            return null;
//            Exception To Do
        }
        election.setDescription(request.getDescription());
        election.setName(request.getName());
        election.setStartTime(request.getStartTime());
        election.setEndTime(request.getEndTime());
        electionModelRepository.save(election);
        return "Election updated";
    }


    @Override
    public void startElection(String electionId) {
        ElectionModel election = getElectionById(electionId);
        if (election == null) {
            throw  new RuntimeException ("Election not found");
        }
        if(election.getStatus() != ElectionStatus.draft || election.getStatus()!=ElectionStatus.stopped) {
            throw new RuntimeException("Can't Start Election");
        }
        election.setStatus(ElectionStatus.running);
//        AuditLog
    }

    @Override
    public void stopElection(String electionId) {
        ElectionModel election = getElectionById(electionId);
        if (election == null) {
            throw  new RuntimeException ("Election not found");
        }
        if(election.getStatus()!=ElectionStatus.running){
            throw new RuntimeException("Can't Stop Election");
        }
        election.setStatus(ElectionStatus.stopped);

    }

    @Override
    public void publishElectionResult(String electionId) {

        ElectionModel election = getElectionById(electionId);
        if (election == null) {
            throw  new RuntimeException ("Election not found");
        }
        if(election.getStatus()!=ElectionStatus.closed){
            throw new RuntimeException("Can't Publish Election");
        }
        election.setStatus(ElectionStatus.published);
//        election.setMerkleRoot(computeMerkleRoote(electionId));
//        to do
        election.setPublishedAt(LocalDateTime.now());
        electionModelRepository.save(election);
//        AuditToDo
    }

    @Override
    public List<ElectionModel> getActiveElections() {
        return List.of();
    }

    @Override
    public ElectionModel getElectionById(String electionId) {
        return electionModelRepository.findById(UUID.fromString(electionId)).orElse(null);
    }
}
