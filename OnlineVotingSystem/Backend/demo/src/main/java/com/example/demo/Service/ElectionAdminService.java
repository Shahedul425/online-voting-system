package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.*;
import com.example.demo.Models.*;
import com.example.demo.Repositories.CandidateListRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.ElectionAdminServiceInterface;
import com.example.demo.ServiceInterface.UserInfoService;
import com.example.demo.Util.Ids;
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
    private final OrganizationService organizationService;
    private final ElectionModelRepository electionModelRepository;
    private final MerkleTreeService merkleTreeService;
    private final VoteModelRepository voteModelRepository;
    private final SafeAuditService safeAuditService;
    private final CandidateListRepository candidateListRepository;
    private final VoterListModelRepository voterListModelRepository;

    @Override
    public ElectionModel createElection(ElectionRequest req) {
        UserModel admin = userInfoService.getCurrentUser();
        OrganizationModel org = admin.getOrganization();
        if (org == null) throw new ForbiddenException("NO_ORG", "Current user is not assigned to an organization");

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setElectionType(req.getElectionType());
        election.setDescription(req.getDescription());
        election.setName(req.getName());
        election.setCreatedBy(admin);
        election.setStartTime(req.getStartTime());
        election.setEndTime(req.getEndTime());
        election.setStatus(ElectionStatus.draft);
        election.setCreatedAt(LocalDateTime.now());

        // integrity: start < end
        if (!req.getStartTime().isBefore(req.getEndTime())) {
            safeAuditService.audit(audit(admin, null, org.getId(), AuditActions.CREATE_ELECTION, ActionStatus.REJECTED,
                    "Invalid time window: startTime must be before endTime"));
            throw new BadRequestException("INVALID_TIME_WINDOW", "startTime must be before endTime");
        }

        ElectionModel saved = electionModelRepository.save(election);

        safeAuditService.audit(audit(admin, saved.getId(), org.getId(), AuditActions.CREATE_ELECTION, ActionStatus.SUCCESS,
                "Election created: " + saved.getName()));

        return saved;
    }

    @Override
    public String updateElection(String electionId, ElectionUpdateRequest req) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.draft) {
            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.UPDATE_ELECTION, ActionStatus.REJECTED, "Election not in draft"));
            throw new ConflictException("ELECTION_NOT_DRAFT", "Only draft elections can be updated");
        }

        if (req.getStartTime() != null && req.getEndTime() != null && !req.getStartTime().isBefore(req.getEndTime())) {
            throw new BadRequestException("INVALID_TIME_WINDOW", "startTime must be before endTime");
        }

        if (req.getDescription() != null) election.setDescription(req.getDescription());
        if (req.getName() != null) election.setName(req.getName());
        if (req.getStartTime() != null) election.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) election.setEndTime(req.getEndTime());

        electionModelRepository.save(election);

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.UPDATE_ELECTION, ActionStatus.SUCCESS, "Election updated: " + election.getName()));

        return "Election updated";
    }

    @Override
    public void startElection(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.draft) {
            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.START_ELECTION, ActionStatus.REJECTED, "Cannot start election from status: " + election.getStatus()));
            throw new ConflictException("INVALID_ELECTION_STATE", "Election cannot be started");
        }

        election.setStatus(ElectionStatus.running);
        electionModelRepository.save(election);

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.START_ELECTION, ActionStatus.SUCCESS, "Election started"));
    }

    @Override
    public void stopElection(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.running) {
            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.STOP_ELECTION, ActionStatus.REJECTED, "Election not running"));
            throw new ConflictException("ELECTION_NOT_RUNNING", "Election must be running to stop");
        }

        election.setStatus(ElectionStatus.stopped);
        electionModelRepository.save(election);

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.STOP_ELECTION, ActionStatus.SUCCESS, "Election stopped"));
    }

    @Override
    public void closeElection(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.running) {
            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.CLOSE_ELECTION, ActionStatus.REJECTED, "Election not running"));
            throw new ConflictException("ELECTION_NOT_RUNNING", "Election must be running to close");
        }

        election.setStatus(ElectionStatus.closed);
        electionModelRepository.save(election);

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.CLOSE_ELECTION, ActionStatus.SUCCESS, "Election closed"));
    }

    @Override
    public void publishElectionResult(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.closed) {
            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.PUBLISH_ELECTION, ActionStatus.REJECTED, "Election not closed"));
            throw new ConflictException("ELECTION_NOT_CLOSED", "Election must be closed to publish");
        }

        List<String> tokens = voteModelRepository.findReceiptTokensByElectionId(election.getId());
        election.setMerkleRoot(merkleTreeService.buildMerkleTree(tokens));
        election.setPublishedAt(LocalDateTime.now());
        election.setStatus(ElectionStatus.published);

        electionModelRepository.save(election);

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.PUBLISH_ELECTION, ActionStatus.SUCCESS, "Election published"));
    }

    @Override
    public ElectionModel getElectionById(String electionId) {
        return getElectionOrThrowAndScope(electionId);
    }

    // list methods can also be org-scoped (they already take orgId / electionId)
    @Override
    public List<ElectionModel> getActiveElections(String orgId) {
        UUID id = Ids.uuid(orgId, "organizationId");
        // enforce: current user org == requested org
        UUID currentOrg = userInfoService.getCurrentUser().getOrganization().getId();
        if (!currentOrg.equals(id)) throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        return electionModelRepository.findByOrganizationIdAndStatus(id, ElectionStatus.running);
    }

    @Override
    public List<CandidateListModel> getCandidateList(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);
        return candidateListRepository.findAllByElectionId_Id(election.getId());
    }

    @Override
    public List<ElectionModel> getElectionByStatus(String status) {
        return List.of();
    }

    @Override
    public List<VoterListModel> getVoterList(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);
        return voterListModelRepository.findByElectionId(election.getId());
    }

    @Override
    public Long totalVoters(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);
        return voterListModelRepository.countByElection_Id(election.getId());
    }

    @Override
    public Long totalCandidates(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);
        return candidateListRepository.countByElectionId_Id(election.getId());
    }

    @Override
    public List<ElectionModel> getAllElections(String orgId) {
        UUID id = Ids.uuid(orgId, "organizationId");
        UUID currentOrg = userInfoService.getCurrentUser().getOrganization().getId();
        if (!currentOrg.equals(id)) throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        return electionModelRepository.findByOrganizationId(id);
    }

    private ElectionModel getElectionOrThrowAndScope(String electionId) {
        UUID eId = Ids.uuid(electionId, "electionId");
        ElectionModel election = electionModelRepository.findById(eId)
                .orElseThrow(() -> new NotFoundException("ELECTION_NOT_FOUND", "Election not found"));

        UserModel user = userInfoService.getCurrentUser();
        UUID userOrg = user.getOrganization().getId();
        if (!election.getOrganization().getId().equals(userOrg)) {
            safeAuditService.audit(audit(user, election.getId(), election.getOrganization().getId(),
                    AuditActions.ACCESS_ELECTION, ActionStatus.FAILED, "Cross-org election access attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "You cannot access this election");
        }
        return election;
    }

    private AuditLogsRequest audit(UserModel actor, UUID electionId, UUID orgId, AuditActions action, ActionStatus status, String details) {
        return AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(electionId != null ? electionId.toString() : null)
                .organizationId(orgId != null ? orgId.toString() : null)
                .action(action.name())
                .status(status.name())
                .entityId("ELECTION")
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
