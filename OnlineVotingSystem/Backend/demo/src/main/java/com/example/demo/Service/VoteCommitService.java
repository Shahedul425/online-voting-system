package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.VoteRequest;
import com.example.demo.DTO.VoteReceiptResponse;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.*;
import com.example.demo.Models.*;
import com.example.demo.Repositories.*;
import com.example.demo.ServiceInterface.CommitServiceInterface;
import com.example.demo.ServiceInterface.UserInfoService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
public class VoteCommitService implements CommitServiceInterface {

    private static final Logger log = LoggerFactory.getLogger(VoteCommitService.class);

    private final OneTimeTokenService tokenService;
    private final OneTimeTokenModelRepository tokenRepo;
    private final ElectionModelRepository electionRepo;
    private final VoteModelRepository voteRepo;
    private final CandidateListRepository candidateRepo;
    private final VoterListModelRepository voterRepo;
    private final VoteSelectionRepository voteSelectionRepository;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;
    private final ReceiptService receiptService;

    @Override
    @Transactional
    public VoteReceiptResponse commitVote(VoteRequest req) {

        UserModel user = userInfoService.getCurrentUser();
        String mdcRequestId = normalize(MDC.get("requestId"));

        // Prefer client requestId, fallback to MDC requestId
        String requestId = normalize(req.getRequestId());
        if (requestId == null) requestId = mdcRequestId;

        UUID electionId = req.getElectionId();

        // ✅ Idempotency: safe retry returns same receipt if requestId matches
        if (requestId != null) {
            var existing = voteRepo.findByRequestId(requestId);
            if (existing.isPresent()) {
                VoteModel v = existing.get();

                auditVote(user, v.getElectionId(), AuditActions.VOTE_CAST, ActionStatus.SUCCESS,
                        "Idempotent replay: returning existing receipt");

                // Do NOT log receipt; return it
                return new VoteReceiptResponse(
                        v.getElectionId().getId(),
                        v.getReceiptHashToken(),
                        v.getCreatedAt()
                );
            }
        }

        ElectionModel election = electionRepo.findById(electionId)
                .orElseThrow(() -> {
                    log.warn("Vote cast failed: election not found {} {}",
                            kv("action", "VOTE_CAST"),
                            kv("electionId", electionId != null ? electionId.toString() : null)
                    );
                    // audit (for election admins)
                    auditVote(user, null, AuditActions.VOTE_CAST, ActionStatus.FAILED, "Election not found");
                    return new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
                });

        if (!election.getOrganization().getId().equals(user.getOrganization().getId())) {
            log.warn("Vote cast blocked: cross-org {} {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString()),
                    kv("userOrgId", user.getOrganization().getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.FAILED, "Cross-org vote attempt");
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        if (election.getStatus() != ElectionStatus.running) {
            log.warn("Vote cast rejected: election not running {} {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.REJECTED,
                    "Election not running: " + election.getStatus().name());

            throw new ConflictException("ELECTION_NOT_RUNNING", "Election is not running");
        }

        // TokenId is sensitive: do NOT log it
        OneTokenModel token = tokenRepo.findByTokenId(req.getTokenId())
                .orElseThrow(() -> {
                    log.warn("Vote cast rejected: token not found {} {}",
                            kv("action", "VOTE_CAST"),
                            kv("status", "REJECTED")
                    );
                    auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.REJECTED, "Token not found");
                    return new NotFoundException("TOKEN_NOT_FOUND", "Token not found");
                });

        if (!token.getElection().getId().equals(electionId)) {
            log.warn("Vote cast blocked: token wrong election {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.FAILED, "Token belongs to different election");
            throw new ForbiddenException("TOKEN_WRONG_ELECTION", "Token is not valid for this election");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Vote cast rejected: token expired {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.REJECTED, "Token expired");
            throw new ConflictException("TOKEN_EXPIRED", "Token has expired");
        }

        if (token.isConsumed()) {
            log.warn("Vote cast rejected: token already used {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.REJECTED, "Token already consumed");
            throw new ConflictException("TOKEN_ALREADY_USED", "Token already used");
        }

        VoterListModel voter = token.getVoter();

        // Do not log email
        if (!voter.getEmail().equalsIgnoreCase(user.getEmail())) {
            log.warn("Vote cast blocked: token not for authenticated user {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.FAILED, "Token not for authenticated user");
            throw new ForbiddenException("TOKEN_NOT_FOR_USER", "Token is not for this user");
        }

        if (voter.isBlocked()) {
            log.warn("Vote cast blocked: voter blocked {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.FAILED, "Voter blocked");
            throw new ForbiddenException("VOTER_BLOCKED", "You are blocked from voting");
        }

        if (voter.isHasVoted()) {
            log.warn("Vote cast rejected: already voted {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.REJECTED, "Voter already voted");
            throw new ConflictException("ALREADY_VOTED", "You have already voted");
        }

        if (req.getVotes() == null || req.getVotes().isEmpty()) {
            log.warn("Vote cast rejected: empty votes {} {} {}",
                    kv("action", "VOTE_CAST"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );

            auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.REJECTED, "No votes provided");
            throw new BadRequestException("EMPTY_VOTES", "You must select at least one candidate");
        }

        // Validate selections (no logs per candidate)
        Set<String> seenPositions = new HashSet<>();
        Map<UUID, CandidateListModel> candCache = new HashMap<>();

        for (var s : req.getVotes()) {
            String pos = normalize(s.getPosition());
            if (pos == null) throw new BadRequestException("POSITION_REQUIRED", "Position is required");

            String key = pos.toLowerCase();
            if (!seenPositions.add(key)) {
                throw new BadRequestException("DUPLICATE_POSITION", "Duplicate position: " + s.getPosition());
            }

            CandidateListModel cand = candidateRepo.findById(s.getCandidateId())
                    .orElseThrow(() -> new NotFoundException("CANDIDATE_NOT_FOUND", "Candidate not found"));

            if (!cand.getElectionId().getId().equals(electionId)) {
                throw new ConflictException("CANDIDATE_NOT_IN_ELECTION", "Candidate does not belong to this election");
            }

            if (cand.getPosition() != null && !cand.getPosition().equalsIgnoreCase(pos)) {
                throw new BadRequestException("POSITION_MISMATCH", "Candidate not in position: " + s.getPosition());
            }

            candCache.put(cand.getId(), cand);
        }

        // Receipt is sensitive: do NOT log it
        String receipt = receiptService.generateReceiptHash(electionId, UUID.randomUUID().toString());

        VoteModel vote = new VoteModel();
        vote.setElectionId(election);
        vote.setReceiptHashToken(receipt);
        vote.setRequestId(requestId);
        vote.setCreatedAt(LocalDateTime.now());
        voteRepo.save(vote);

        for (var s : req.getVotes()) {
            VoteSelectionModel vs = new VoteSelectionModel();
            vs.setVote(vote);
            vs.setPosition(s.getPosition().trim());
            vs.setCandidateId(candCache.get(s.getCandidateId()));
            voteSelectionRepository.save(vs);
        }

        tokenService.consumeByTokenId(req.getTokenId());

        voter.setHasVoted(true);
        voter.setVotedAt(LocalDateTime.now());
        voterRepo.save(voter);

        // ✅ audit SUCCESS for admins (don’t store selections list; count is fine)
        auditVote(user, election, AuditActions.VOTE_CAST, ActionStatus.SUCCESS,
                "Vote cast successfully. selections=" + req.getVotes().size());

        return new VoteReceiptResponse(electionId, receipt, vote.getCreatedAt());
    }

    private void auditVote(UserModel actor,
                           ElectionModel election,
                           AuditActions action,
                           ActionStatus status,
                           String details) {

        safeAuditService.audit(AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(election != null ? election.getId().toString() : null)
                .organizationId(election != null ? election.getOrganization().getId().toString() : null)
                .action(action.name())
                .status(status.name())
                .entityId("VoteModel")
                .details(details)
                .requestId(MDC.get("requestId")) // ✅ bridge
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String normalize(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isBlank() ? null : v;
    }
}
