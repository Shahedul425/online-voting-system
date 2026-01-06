package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Models.*;
import com.example.demo.Repositories.CandidateListRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
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
    private final MerkleTreeService merkleTreeService;
    private final VoteModelRepository voteModelRepository;
    private final SafeAuditService safeAuditService;
    private final CandidateListRepository candidateListRepository;
    private final VoterListModelRepository voterListModelRepository;

    @Override
    public ElectionModel createElection(ElectionRequest electionRequest) {
        UserModel admin = userInfoService.getCurrentUser();
        OrganizationModel organization = organizationService.findById(String.valueOf(admin.getOrganization().getId()));
        ElectionModel election = null;
        try {
            if (organization == null) {
                return null;
//            Runtime Error later implementation to do
            }
            election = new ElectionModel();
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
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(admin.getId().toString())
                            .action(String.valueOf(AuditActions.CREATE_ELECTION))
                            .electionId(election.getId().toString())
                            .createdAt(LocalDateTime.now())
                            .details("Election created: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.SUCCESS))
                            .organizationId(organization.getId().toString())
                            .build()
            );
            return election;
        } catch (BusinessException e) {
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(admin.getId().toString())
                            .action(String.valueOf(AuditActions.CREATE_ELECTION))
                            .electionId(election.getId().toString())
                            .createdAt(LocalDateTime.now())
                            .details("Failed to create election: " + election.getName() + "Exception: " + e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.REJECTED))
                            .organizationId(organization.getId().toString())
                            .build()
            );
            throw e;
        }
        catch (Exception e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(admin.getId().toString())
                            .action(AuditActions.CREATE_ELECTION.name())
                            .details("System error: " + e.getMessage())
                            .entityId("ELECTION")
                            .organizationId(
                                    admin.getOrganization() != null
                                            ? admin.getOrganization().getId().toString()
                                            : null
                            )
                            .status(ActionStatus.FAILED.name())
                            .createdAt(LocalDateTime.now())
                            .build()
            );
            throw e;

        }
    }

    @Override
    public String updateElection(String electionId, ElectionUpdateRequest request) {
        ElectionModel election = getElectionById(electionId);
        try {
            if (election == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPDATE_ELECTION.toString())
                                .details("Election update failed: " + election.getName() +" Election not found")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                return "Election Not Found";
//            Exception to do
            }
            if(election.getStatus() != ElectionStatus.draft) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPDATE_ELECTION.toString())
                                .details("Election update failed: " + election.getName() +" Election not in draft")
                                .entityId("ELECTION")
                                .createdAt(LocalDateTime.now())
                                .status(String.valueOf(ActionStatus.FAILED))
                                .build()
                );
                return "Election Not in Draft";

//            Exception To Do
            }
            election.setDescription(request.getDescription());
            election.setName(request.getName());
            election.setStartTime(request.getStartTime());
            election.setEndTime(request.getEndTime());
            electionModelRepository.save(election);
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPDATE_ELECTION.toString())
                            .details("Election updated: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.SUCCESS))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
            return "Election updated";
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPDATE_ELECTION.toString())
                            .details("Election update failed: " + election.getName() +e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.REJECTED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
            throw e;
        }
        catch (Exception e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPDATE_ELECTION.toString())
                            .details("Election update failed: " + election.getName() +e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.FAILED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
            throw e;
        }

    }


    @Override
    public void startElection(String electionId) {
        ElectionModel election = getElectionById(electionId);
        try {
            if (election == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.START_ELECTION.toString())
                                .details("Election Starting failed: " + election.getName() + " Election not found")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw  new RuntimeException ("Election not found");
            }
            if(election.getStatus() == ElectionStatus.closed ||
                    election.getStatus()==ElectionStatus.stopped||
                    election.getStatus()==ElectionStatus.running||
                    election.getStatus()==ElectionStatus.published) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.START_ELECTION.toString())
                                .details("Election Starting failed: " + election.getName() + " Election not in draft or already running")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw new RuntimeException("Can't Start Election");

            }
            election.setStatus(ElectionStatus.running);
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.START_ELECTION.toString())
                            .details("Election Started: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.SUCCESS))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        } catch (Exception e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.START_ELECTION.toString())
                            .details("Election Starting failed: " + election.getName() + e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.FAILED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }

//        AuditLog
    }

    @Override
    public void stopElection(String electionId) {
        ElectionModel election = getElectionById(electionId);
        try {


            if (election == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.STOP_ELECTION.toString())
                                .details("Election Stopping failed: " + election.getName() + " Election not found")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw new RuntimeException("Election not found");
            }
            if (election.getStatus() != ElectionStatus.running) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.STOP_ELECTION.toString())
                                .details("Election Stopping failed: " + election.getName() + " Election not Running")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw new RuntimeException("Can't Stop Election");
            }
            election.setStatus(ElectionStatus.stopped);
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.STOP_ELECTION.toString())
                            .details("Election Stopped: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.SUCCESS))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.STOP_ELECTION.toString())
                            .details("Election Stopping failed: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.FAILED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }catch (Exception e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.STOP_ELECTION.toString())
                            .details("Election Stopping failed: " + election.getName() + e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.FAILED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }

    }

    @Override
    public void publishElectionResult(String electionId) {
        List<String> tokens = voteModelRepository.findReceiptTokensByElectionId(UUID.fromString(electionId));
        ElectionModel election = getElectionById(electionId);
        try {
            if (election == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(null)
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.PUBLISH_ELECTION.toString())
                                .details("Election publish failed: " + election.getName() + " Election not found")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw  new RuntimeException ("Election not found");
            }
            if(election.getStatus()!=ElectionStatus.closed){
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.PUBLISH_ELECTION.toString())
                                .details("Election publish failed: " + election.getName() + " Election not closed")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw new RuntimeException("Can't Publish Election");
            }
            election.setStatus(ElectionStatus.published);
            election.setMerkleRoot(merkleTreeService.buildMerkleTree(tokens));

//        to do
            election.setPublishedAt(LocalDateTime.now());
            electionModelRepository.save(election);
//        AuditToDo
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.PUBLISH_ELECTION.toString())
                            .details("Election published: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.SUCCESS))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.PUBLISH_ELECTION.toString())
                            .details("Election publish failed: " + election.getName()+e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.FAILED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }

    }

    @Override
    public void closeElection(String electionId) {
        ElectionModel election = getElectionById(electionId);
        try {


            if (election == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.CLOSE_ELECTION.toString())
                                .details("Election Closing failed: " + election.getName() + " Election not found")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw new RuntimeException("Election not found");
            }
            if (election.getStatus() != ElectionStatus.running) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .electionId(election.getId().toString())
                                .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.CLOSE_ELECTION.toString())
                                .details("Election Closing failed: " + election.getName() + " Election not Running")
                                .entityId("ELECTION")
                                .status(String.valueOf(ActionStatus.FAILED))
                                .createdAt(LocalDateTime.now())
                                .build()
                );
                throw new RuntimeException("Can't Close Election");
            }
            election.setStatus(ElectionStatus.closed);
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.CLOSE_ELECTION.toString())
                            .details("Election closed: " + election.getName())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.SUCCESS))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .electionId(election.getId().toString())
                            .organizationId(election.getOrganization().getId().toString())
//                                check runtime might be problem
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.CLOSE_ELECTION.toString())
                            .details("Election closing failed: " + election.getName()+e.getMessage())
                            .entityId("ELECTION")
                            .status(String.valueOf(ActionStatus.FAILED))
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        }
    }

    @Override
    public List<ElectionModel> getActiveElections(String id) {
        UUID orgId = UUID.fromString(id);
        return electionModelRepository.findByOrganizationIdAndStatus(orgId,ElectionStatus.running);
    }

    @Override
    public List<CandidateListModel> getCandidateList(String id) {
        UUID electionId = UUID.fromString(id);
        return candidateListRepository.findAllByElectionId_Id(electionId);
    }

    @Override
    public List<ElectionModel> getElectionByStatus(String status) {
        return electionModelRepository.findByStatus(ElectionStatus.valueOf(status));
    }

    @Override
    public List<VoterListModel> getVoterList(String id) {
        UUID electionId = UUID.fromString(id);
        return voterListModelRepository.findByElectionId(electionId);
    }


    @Override
    public ElectionModel getElectionById(String electionId) {
        return electionModelRepository.findById(UUID.fromString(electionId)).orElse(null);
    }

    @Override
    public Long totalVoters(String id) {
        UUID electionId = UUID.fromString(id);
        return voterListModelRepository.countByElection_Id(electionId);
    }

    @Override
    public Long totalCandidates(String id) {
        UUID electionId = UUID.fromString(id);
        return candidateListRepository.countByElectionId_Id(electionId);
    }

    @Override
    public List<ElectionModel> getAllElections(String id) {
        UUID orgId = UUID.fromString(id);
        return electionModelRepository.findByOrganizationId(orgId);
    }
}
