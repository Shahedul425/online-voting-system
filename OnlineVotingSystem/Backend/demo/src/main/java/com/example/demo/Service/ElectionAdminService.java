package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.*;
import com.example.demo.Models.*;
import com.example.demo.Repositories.*;
import com.example.demo.ServiceInterface.ElectionAdminServiceInterface;
import com.example.demo.ServiceInterface.UserInfoService;
import com.example.demo.Util.Ids;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
public class ElectionAdminService implements ElectionAdminServiceInterface {

    private static final Logger log = LoggerFactory.getLogger(ElectionAdminService.class);

    private final UserInfoService userInfoService;
    private final OrganizationService organizationService; // unchanged
    private final ElectionModelRepository electionModelRepository;
    private final MerkleTreeService merkleTreeService;
    private final VoteModelRepository voteModelRepository;
    private final SafeAuditService safeAuditService;
    private final CandidateListRepository candidateListRepository;
    private final VoterListModelRepository voterListModelRepository;
    private final HashLevelCodec hashLevelCodec;
    private final MerkleLevelModelRepository merkleLevelModelRepository;
    private final ReceiptLeafIndexRepository receiptLeafIndexRepository;

    @Override
    public ElectionModel createElection(ElectionRequest req) {
        UserModel admin = userInfoService.getCurrentUser();
        OrganizationModel org = admin.getOrganization();

        if (org == null) {
            log.warn("election create blocked",
                    kv("action", "CREATE_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "BLOCKED"),
                    kv("reason", "NO_ORG")
            );
            throw new ForbiddenException("NO_ORG", "Current user is not assigned to an organization");
        }

        if (!req.getStartTime().isBefore(req.getEndTime())) {
            log.warn("election create rejected",
                    kv("action", "CREATE_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "INVALID_TIME_WINDOW"),
                    kv("orgId", org.getId().toString())
            );

            safeAuditService.audit(audit(admin, null, org.getId(), AuditActions.CREATE_ELECTION, ActionStatus.REJECTED,
                    "Invalid time window: startTime must be before endTime"));
            throw new BadRequestException("INVALID_TIME_WINDOW", "startTime must be before endTime");
        }

        // business logic unchanged
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

        ElectionModel saved = electionModelRepository.save(election);

        safeAuditService.audit(audit(admin, saved.getId(), org.getId(), AuditActions.CREATE_ELECTION, ActionStatus.SUCCESS,
                "Election created: " + saved.getName()));

        return saved;
    }

    @Override
    public String updateElection(String electionId, ElectionUpdateRequest req) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.draft) {
            log.warn("election update rejected",
                    kv("action", "UPDATE_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "ELECTION_NOT_DRAFT"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name())
            );

            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.UPDATE_ELECTION, ActionStatus.REJECTED, "Election not in draft"));
            throw new ConflictException("ELECTION_NOT_DRAFT", "Only draft elections can be updated");
        }

        if (req.getStartTime() != null && req.getEndTime() != null && !req.getStartTime().isBefore(req.getEndTime())) {
            log.warn("election update rejected",
                    kv("action", "UPDATE_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "INVALID_TIME_WINDOW"),
                    kv("electionId", election.getId().toString())
            );
            throw new BadRequestException("INVALID_TIME_WINDOW", "startTime must be before endTime");
        }

        // business logic unchanged
        if (req.getDescription() != null) election.setDescription(req.getDescription());
        if (req.getName() != null) election.setName(req.getName());
        if (req.getStartTime() != null) election.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) election.setEndTime(req.getEndTime());

        electionModelRepository.save(election);

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.UPDATE_ELECTION, ActionStatus.SUCCESS, "Election updated: " + election.getName()));

        return "Election updated";
    }

//    STOPPED ELECTION SHOULD BE ABLE TO RESUME CURRENTLY NOT

    @Override
    public void startElection(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);

        if (election.getStatus() != ElectionStatus.draft) {
            log.warn("election start rejected",
                    kv("action", "START_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "INVALID_ELECTION_STATE"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name()),
                    kv("requiredStatus", ElectionStatus.draft.name())
            );

            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.START_ELECTION, ActionStatus.REJECTED,
                    "Cannot start election from status: " + election.getStatus()));
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
            log.warn("election stop rejected",
                    kv("action", "STOP_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "ELECTION_NOT_RUNNING"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name()),
                    kv("requiredStatus", ElectionStatus.running.name())
            );

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
            log.warn("election close rejected",
                    kv("action", "CLOSE_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "ELECTION_NOT_RUNNING"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name()),
                    kv("requiredStatus", ElectionStatus.running.name())
            );

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

        if (election.getStatus() == ElectionStatus.published) {
            log.warn("election publish rejected",
                    kv("action", "PUBLISH_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "ALREADY_PUBLISHED"),
                    kv("electionId", election.getId().toString())
            );
            throw new ConflictException("ALREADY_PUBLISHED", "Election already published");
        }
        if (election.getStatus() != ElectionStatus.closed) {
            log.warn("election publish rejected",
                    kv("action", "PUBLISH_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "ELECTION_NOT_CLOSED"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name()),
                    kv("requiredStatus", ElectionStatus.closed.name())
            );

            safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                    AuditActions.PUBLISH_ELECTION, ActionStatus.REJECTED, "Election not closed"));
            throw new ConflictException("ELECTION_NOT_CLOSED", "Election must be closed to publish");
        }



        var votes = voteModelRepository.findByElectionOrdered(election.getId());
        if (votes.isEmpty()) {
            log.warn("election publish rejected",
                    kv("action", "PUBLISH_ELECTION"),
                    kv("entity", "ELECTION"),
                    kv("result", "REJECTED"),
                    kv("reason", "NO_VOTES"),
                    kv("electionId", election.getId().toString())
            );
            throw new ConflictException("NO_VOTES", "No votes found");
        }

        // No INFO phase logs (noise); if this becomes slow later, we’ll log WARN only on anomaly.

        // business logic unchanged
        List<String> tokens = votes.stream().map(VoteModel::getReceiptHashToken).toList();
        var built = merkleTreeService.buildMerkleTree(tokens);

        String rootB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(built.root());
        election.setMerkleRoot(rootB64);
        election.setPublishedAt(LocalDateTime.now());
        election.setStatus(ElectionStatus.published);

        electionModelRepository.save(election);

        for (var lvl : built.levels()) {
            MerkelLevelModel m = new MerkelLevelModel();
            m.setElection(election);
            m.setLevel(lvl.level());
            m.setNodeCount(lvl.nodes().size());
            m.setHashBlob(hashLevelCodec.pack(lvl.nodes()));
            m.setCreatedAt(LocalDateTime.now());
            merkleLevelModelRepository.save(m);
        }

        for (int i = 0; i < votes.size(); i++) {
            VoteModel vote = votes.get(i);
            byte[] leaf = merkleTreeService.leafHashFromReceiptToken(vote.getReceiptHashToken());
            ReceiptLeafIndexModel idx = new ReceiptLeafIndexModel();
            idx.setElection(election);
            idx.setReceiptKeyHash(leaf);
            idx.setLeafIndex(i);
            idx.setVotedAt(vote.getCreatedAt());
            receiptLeafIndexRepository.save(idx);
        }

        safeAuditService.audit(audit(userInfoService.getCurrentUser(), election.getId(), election.getOrganization().getId(),
                AuditActions.PUBLISH_ELECTION, ActionStatus.SUCCESS, "Election published"));
    }
    @Override
    public ElectionModel getElectionById(String electionId) {
        return getElectionOrThrowAndScope(electionId);
    }

    @Override
    public List<ElectionModel> getActiveElections(String orgId) {
        UUID id = Ids.uuid(orgId, "organizationId");
        UUID currentOrg = userInfoService.getCurrentUser().getOrganization().getId();
        if (!currentOrg.equals(id)) {
            log.warn("Cross-org access blocked {} {} {} {}",
                    kv("action", "GET_ACTIVE_ELECTIONS"),
                    kv("status", "FAILED"),
                    kv("requestedOrgId", id.toString()),
                    kv("userOrgId", currentOrg.toString())
            );
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }
        return electionModelRepository.findByOrganizationIdAndStatus(id, ElectionStatus.running);
    }

    @Override
    public List<CandidateListModel> getCandidateList(String electionId) {
        ElectionModel election = getElectionOrThrowAndScope(electionId);
        return candidateListRepository.findAllByElectionId_Id(election.getId());
    }

    @Override
    public List<ElectionModel> getElectionByStatus(String status, String orgId) {
        return electionModelRepository.findByOrganizationIdAndStatus(UUID.fromString(orgId), ElectionStatus.valueOf(status));
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
        if (!currentOrg.equals(id)) {
            log.warn("Cross-org access blocked {} {} {} {}",
                    kv("action", "GET_ALL_ELECTIONS"),
                    kv("status", "FAILED"),
                    kv("requestedOrgId", id.toString()),
                    kv("userOrgId", currentOrg.toString())
            );
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }
        return electionModelRepository.findByOrganizationId(id);
    }

    private ElectionModel getElectionOrThrowAndScope(String electionId) {
        UUID eId = Ids.uuid(electionId, "electionId");
        ElectionModel election = electionModelRepository.findById(eId)
                .orElseThrow(() -> new NotFoundException("ELECTION_NOT_FOUND", "Election not found"));

        UserModel user = userInfoService.getCurrentUser();
        UUID userOrg = user.getOrganization().getId();
        if (!election.getOrganization().getId().equals(userOrg)) {
            log.warn("Cross-org election access blocked {} {} {} {}",
                    kv("action", "ACCESS_ELECTION"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString()),
                    kv("userOrgId", userOrg.toString())
            );

            safeAuditService.audit(audit(user, election.getId(), election.getOrganization().getId(),
                    AuditActions.ACCESS_ELECTION, ActionStatus.FAILED, "Cross-org election access attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "You cannot access this election");
        }
        return election;
    }


    private AuditLogsRequest audit(UserModel actor, UUID electionId, UUID orgId,
                                   AuditActions action, ActionStatus status, String details) {
        return AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(electionId != null ? electionId.toString() : null)
                .organizationId(orgId != null ? orgId.toString() : null)
                .action(action.name())
                .status(status.name())
                .entityId("ELECTION")
                .details(details)
                // .createdAt(LocalDateTime.now())  // remove once AuditLogsModel sets createdAt automatically
                .createdAt(LocalDateTime.now())   // keep for now if your entity still requires it
                .build();
    }
}
