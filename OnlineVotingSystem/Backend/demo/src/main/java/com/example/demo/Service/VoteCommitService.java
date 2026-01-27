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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VoteCommitService implements CommitServiceInterface {

    private final OneTimeTokenService tokenService;
    private final OneTimeTokenModelRepository tokenRepo;
    private final ElectionModelRepository electionRepo;
    private final VoteModelRepository voteRepo;
    private final CandidateListRepository candidateRepo;
    private final VoterListModelRepository voterRepo;
    private final VoteSelectionRepository voteSelectionRepository;
    private final HashService hashService;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;
    private final ReceiptService receiptService;

    @Override
    @Transactional
    public VoteReceiptResponse commitVote(VoteRequest req) {
        UserModel user = userInfoService.getCurrentUser();

        // ✅ idempotency (safe retry)
        if (req.getRequestId() != null && !req.getRequestId().isBlank()) {
            var existing = voteRepo.findByRequestId(req.getRequestId().trim());
            if (existing.isPresent()) {
                VoteModel v = existing.get();

                // Optional: audit idempotent replay (not required but useful)
                safeAuditService.audit(AuditLogsRequest.builder()
                        .actor(user.getId().toString())
                        .electionId(v.getElectionId().getId().toString())
                        .organizationId(user.getOrganization().getId().toString())
                        .entityId(v.getId().toString())
                        .action(AuditActions.VOTE_CAST.name())
                        .status(ActionStatus.SUCCESS.name())
                        .details("Idempotent replay: requestId reused, returning existing receipt")
                        .createdAt(LocalDateTime.now())
                        .build());

                return new VoteReceiptResponse(v.getElectionId().getId(), v.getReceiptHashToken(), v.getCreatedAt());
            }
        }

        ElectionModel election = electionRepo.findById(req.getElectionId())
                .orElseThrow(() -> new NotFoundException("ELECTION_NOT_FOUND", "Election not found"));

        if (!election.getOrganization().getId().equals(user.getOrganization().getId())) {
            safeAuditService.audit(failedAudit(user, election, "Cross-org vote attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        if (election.getStatus() != ElectionStatus.running) {
            safeAuditService.audit(failedAudit(user, election, "Election not running: " + election.getStatus()));
            throw new ConflictException("ELECTION_NOT_RUNNING", "Election is not running");
        }

        OneTokenModel token = tokenRepo.findByTokenId(req.getTokenId())
                .orElseThrow(() -> new NotFoundException("TOKEN_NOT_FOUND", "Token not found"));

        if (!token.getElection().getId().equals(req.getElectionId())) {
            safeAuditService.audit(failedAudit(user, election, "Token belongs to different election"));
            throw new ForbiddenException("TOKEN_WRONG_ELECTION", "Token is not valid for this election");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            safeAuditService.audit(failedAudit(user, election, "Token expired"));
            throw new ConflictException("TOKEN_EXPIRED", "Token has expired");
        }

        if (token.isConsumed()) {
            safeAuditService.audit(failedAudit(user, election, "Token already consumed"));
            throw new ConflictException("TOKEN_ALREADY_USED", "Token already used");
        }

        VoterListModel voter = token.getVoter();

        if (!voter.getEmail().equalsIgnoreCase(user.getEmail())) {
            safeAuditService.audit(failedAudit(user, election, "Token not for authenticated user"));
            throw new ForbiddenException("TOKEN_NOT_FOR_USER", "Token is not for this user");
        }

        if (voter.isBlocked()) {
            safeAuditService.audit(failedAudit(user, election, "Voter blocked"));
            throw new ForbiddenException("VOTER_BLOCKED", "You are blocked from voting");
        }

        if (voter.isHasVoted()) {
            safeAuditService.audit(failedAudit(user, election, "Voter already voted"));
            throw new ConflictException("ALREADY_VOTED", "You have already voted");
        }

        // ✅ Validate selections: 1 per position + candidate belongs to election + optional position match
        if (req.getVotes() == null || req.getVotes().isEmpty()) {
            safeAuditService.audit(failedAudit(user, election, "No votes provided"));
            throw new BadRequestException("EMPTY_VOTES", "You must select at least one candidate");
        }

        Set<String> seen = new HashSet<>();
        Map<UUID, CandidateListModel> candCache = new HashMap<>();

        for (var s : req.getVotes()) {
            String pos = (s.getPosition() == null ? "" : s.getPosition().trim()).toLowerCase();
            if (pos.isBlank()) throw new BadRequestException("POSITION_REQUIRED", "Position is required");

            if (!seen.add(pos)) {
                throw new BadRequestException("DUPLICATE_POSITION", "Duplicate position: " + s.getPosition());
            }

            CandidateListModel cand = candidateRepo.findById(s.getCandidateId())
                    .orElseThrow(() -> new NotFoundException("CANDIDATE_NOT_FOUND", "Candidate not found"));

            if (!cand.getElectionId().getId().equals(req.getElectionId())) {
                throw new ConflictException("CANDIDATE_NOT_IN_ELECTION", "Candidate does not belong to this election");
            }

            if (cand.getPosition() != null && !cand.getPosition().equalsIgnoreCase(s.getPosition().trim())) {
                throw new BadRequestException("POSITION_MISMATCH", "Candidate not in position: " + s.getPosition());
            }

            candCache.put(cand.getId(), cand);
        }

        // ✅ Create ONE receipt for whole ballot
        String receipt = receiptService.generateReceiptHash(req.getElectionId(), String.valueOf(UUID.randomUUID()));

        VoteModel vote = new VoteModel();
        vote.setElectionId(election);
        // vote.setVoter(voter); // recommended (enable when your entity includes voter relation)
        vote.setReceiptHashToken(receipt);
        vote.setRequestId(req.getRequestId() == null ? null : req.getRequestId().trim());
        voteRepo.save(vote);

        for (var s : req.getVotes()) {
            VoteSelectionModel vs = new VoteSelectionModel();
            vs.setVote(vote);
            vs.setPosition(s.getPosition().trim());
            vs.setCandidateId(candCache.get(s.getCandidateId()));
            voteSelectionRepository.save(vs);
        }

        // ✅ Consume token + mark voted
        tokenService.consumeByTokenId(req.getTokenId());

        voter.setHasVoted(true);
        voter.setVotedAt(LocalDateTime.now());
        voterRepo.save(voter);

        // ✅ SUCCESS audit (safe)
        safeAuditService.audit(AuditLogsRequest.builder()
                .actor(user.getId().toString())
                .electionId(election.getId().toString())
                .organizationId(election.getOrganization().getId().toString())
                .entityId(vote.getId().toString())
                .action(AuditActions.VOTE_CAST.name())
                .status(ActionStatus.SUCCESS.name())
                .details("Vote cast successfully. selections=" + req.getVotes().size())
                .createdAt(LocalDateTime.now())
                .build());

        return new VoteReceiptResponse(req.getElectionId(), receipt, vote.getCreatedAt());
    }

    private AuditLogsRequest failedAudit(UserModel user, ElectionModel election, String details) {
        return AuditLogsRequest.builder()
                .actor(user != null ? user.getId().toString() : null)
                .electionId(election != null ? election.getId().toString() : null)
                .organizationId(user != null ? user.getOrganization().getId().toString() : null)
                .entityId("VoteModel")
                .action(AuditActions.VOTE_CAST.name())
                .status(ActionStatus.FAILED.name())
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
