package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DTO.CandidateResultRow;
import com.example.demo.DTO.CandidateTallyRow;
import com.example.demo.DTO.ElectionResultsResponse;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoteModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoteSelectionRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.Util.Ids;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
public class AdminElectionResultService {

    private static final Logger log = LoggerFactory.getLogger(AdminElectionResultService.class);

    private final ElectionModelRepository electionRepo;
    private final VoteSelectionRepository voteSelectionRepo;
    private final VoteModelRepository voteRepo;
    private final VoterListModelRepository voterRepo;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;

    @Value("${ovs.public.base-url:http://localhost:5173}")
    private String publicBaseUrl;

    public ElectionResultsResponse getAdminResults(String electionId) {

        UserModel actor = userInfoService.getCurrentUser();
        UUID eId = Ids.uuid(electionId, "electionId");

        ElectionModel election = electionRepo.findById(eId)
                .orElseThrow(() -> {
                    log.warn("results access failed",
                            kv("action", "ADMIN_VIEW_RESULTS"),
                            kv("entity", "RESULTS"),
                            kv("result", "FAILED"),
                            kv("reason", "ELECTION_NOT_FOUND"),
                            kv("electionId", electionId)
                    );

                    safeAuditService.audit(audit(actor, null, actor.getOrganization().getId(),
                            AuditActions.ADMIN_VIEW_RESULTS, ActionStatus.FAILED,
                            "Election not found"));

                    return new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
                });

        UUID userOrg = actor.getOrganization().getId();
        UUID electionOrg = election.getOrganization().getId();

        if (!electionOrg.equals(userOrg)) {
            log.warn("results access blocked",
                    kv("action", "ADMIN_VIEW_RESULTS"),
                    kv("entity", "RESULTS"),
                    kv("result", "BLOCKED"),
                    kv("reason", "CROSS_ORG_ACCESS"),
                    kv("electionId", election.getId().toString()),
                    kv("electionOrgId", electionOrg.toString())
            );

            safeAuditService.audit(audit(actor, election.getId(), electionOrg,
                    AuditActions.ADMIN_VIEW_RESULTS, ActionStatus.FAILED,
                    "Cross-org results access attempt"));

            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        try {
            ElectionResultsResponse resp = buildPublishedResultsOrThrow(election, actor);

            safeAuditService.audit(audit(actor, election.getId(), electionOrg,
                    AuditActions.ADMIN_VIEW_RESULTS, ActionStatus.SUCCESS,
                    "Admin results viewed"));

            return resp;

        } catch (RuntimeException ex) {

            // unexpected system failure
            log.error("results generation failed",
                    kv("action", "ADMIN_VIEW_RESULTS"),
                    kv("entity", "RESULTS"),
                    kv("result", "ERROR"),
                    kv("electionId", election.getId().toString()),
                    kv("exception", ex.getClass().getSimpleName())
            );

            throw ex;
        }
    }

    private ElectionResultsResponse buildPublishedResultsOrThrow(ElectionModel election, UserModel actor) {

        if (election.getStatus() != ElectionStatus.published || election.getMerkleRoot() == null) {

            log.warn("results rejected",
                    kv("action", "ADMIN_VIEW_RESULTS"),
                    kv("entity", "RESULTS"),
                    kv("result", "REJECTED"),
                    kv("reason", "NOT_PUBLISHED"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name())
            );

            safeAuditService.audit(audit(actor, election.getId(), election.getOrganization().getId(),
                    AuditActions.ADMIN_VIEW_RESULTS, ActionStatus.REJECTED,
                    "Results requested but election not published"));

            throw new ConflictException("NOT_PUBLISHED", "Election is not published");
        }

        long totalVoters = voterRepo.countByElection_Id(election.getId());
        long votedCount = voterRepo.countByElection_IdAndHasVotedTrue(election.getId());
        long ballotsCast = voteRepo.countByElectionId_Id(election.getId());

        double turnout = totalVoters == 0 ? 0.0 : (100.0 * votedCount / (double) totalVoters);

        List<CandidateTallyRow> tally = voteSelectionRepo.tallyByElection(election.getId());

        Map<String, List<CandidateResultRow>> byPos = new LinkedHashMap<>();
        Map<String, Long> posTotals = new HashMap<>();

        for (CandidateTallyRow r : tally) {
            posTotals.merge(r.getPosition(), r.getVotes(), Long::sum);
        }

        Map<String, Integer> rankCounter = new HashMap<>();

        for (CandidateTallyRow r : tally) {
            String pos = r.getPosition();
            long posTotal = posTotals.getOrDefault(pos, 0L);

            int rank = rankCounter.merge(pos, 1, Integer::sum);
            boolean winner = rank == 1;

            double share = posTotal == 0 ? 0.0 : (100.0 * r.getVotes() / (double) posTotal);

            CandidateResultRow row = new CandidateResultRow(
                    r.getCandidateId(),
                    (r.getFirstName() + " " + r.getLastName()).trim(),
                    r.getBallotSerial(),
                    r.getPhotoUrl(),
                    r.getVotes(),
                    round2(share),
                    rank,
                    winner
            );

            byPos.computeIfAbsent(pos, k -> new ArrayList<>()).add(row);
        }

        ElectionResultsResponse resp = new ElectionResultsResponse();

        resp.setElectionId(election.getId());
        resp.setElectionName(election.getName());
        resp.setElectionType(election.getElectionType());

        resp.setOrganizationId(election.getOrganization().getId());
        resp.setOrganizationName(election.getOrganization().getName());

        resp.setStatus(election.getStatus().name());
        resp.setCreatedAt(election.getCreatedAt());
        resp.setStartTime(election.getStartTime());
        resp.setEndTime(election.getEndTime());
        resp.setPublishedAt(election.getPublishedAt());

        resp.setMerkleRootB64(election.getMerkleRoot());

        resp.setTotalVoters(totalVoters);
        resp.setVotedCount(votedCount);
        resp.setTurnoutPercent(round2(turnout));
        resp.setBallotsCast(ballotsCast);

        resp.setResultsByPosition(byPos);

        // ───── NEW: fill margin fields on each winner row ──────────────────────
        for (Map.Entry<String, List<CandidateResultRow>> e : byPos.entrySet()) {
            List<CandidateResultRow> rows = e.getValue();
            if (rows.size() < 2) continue;
            CandidateResultRow winner = rows.get(0);
            CandidateResultRow runnerUp = rows.get(1);
            winner.setMarginOverRunnerUp(winner.getVotes() - runnerUp.getVotes());
            winner.setMarginPercent(round2(winner.getVoteSharePercent() - runnerUp.getVoteSharePercent()));
        }

        // ───── NEW: publication-masthead fields ───────────────────────────────
        List<VoteModel> votes = voteRepo.findByElectionOrdered(election.getId());

        if (!votes.isEmpty()) {
            resp.setFirstBallotAt(votes.get(0).getCreatedAt());
            resp.setLastBallotAt(votes.get(votes.size() - 1).getCreatedAt());
        }

        // 24 hourly buckets (UTC hour-of-day).
        long[] buckets = new long[24];
        for (VoteModel v : votes) {
            if (v.getCreatedAt() == null) continue;
            int h = v.getCreatedAt().getHour();
            if (h >= 0 && h < 24) buckets[h]++;
        }
        List<Long> timeline = new ArrayList<>(24);
        int peak = 0;
        for (int i = 0; i < 24; i++) {
            timeline.add(buckets[i]);
            if (buckets[i] > buckets[peak]) peak = i;
        }
        resp.setTurnoutTimeline(timeline);
        resp.setPeakHour(String.format("%02d:00–%02d:00", peak, (peak + 1) % 24));

        // Public verify URL
        resp.setShareUrl(publicBaseUrl + "/verify-receipt?election=" + election.getId());

        return resp;
    }

    private AuditLogsRequest audit(UserModel actor, UUID electionId, UUID orgId,
                                   AuditActions action, ActionStatus status, String details) {
        return AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(electionId != null ? electionId.toString() : null)
                .organizationId(orgId != null ? orgId.toString() : null)
                .action(action.name())
                .status(status.name())
                .entityId("RESULTS")
                .details(details)
                .build();
    }

    private static double round2(double x) {
        return Math.round(x * 100.0) / 100.0;
    }
}
