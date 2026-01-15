package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.*;
import com.example.demo.Repositories.*;
import com.example.demo.ServiceInterface.CommitServiceInterface;
import com.example.demo.ServiceInterface.UserInfoService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class VoteCommitService implements CommitServiceInterface {

    private final OneTimeTokenService tokenService;
    private final OneTimeTokenModelRepository tokenRepo;
    private final ElectionModelRepository electionRepo;
    private final VoteModelRepository voteRepo;
    private final CandidateListRepository candidateRepo;
    private final VoterListModelRepository voterRepo;
    private final HashService hashService;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;

    @Override
    @Transactional
    public String commitVote(UUID electionId, UUID candidateId, String tokenId) {

        UserModel user = userInfoService.getCurrentUser();

        ElectionModel election = electionRepo.findById(electionId)
                .orElseThrow(() -> new NotFoundException("ELECTION_NOT_FOUND", "Election not found"));

        if (!election.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        if (election.getStatus() != ElectionStatus.running) {
            throw new ConflictException("ELECTION_NOT_RUNNING", "Election is not running");
        }

        CandidateListModel candidate = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new NotFoundException("CANDIDATE_NOT_FOUND", "Candidate not found"));

        if (!candidate.getElectionId().getId().equals(electionId)) {
            throw new ConflictException("CANDIDATE_NOT_IN_ELECTION", "Candidate does not belong to this election");
        }

        OneTokenModel token = tokenRepo.findByTokenId(tokenId)
                .orElseThrow(() -> new NotFoundException("TOKEN_NOT_FOUND", "Token not found"));

        // token integrity
        if (!token.getElection().getId().equals(electionId)) {
            throw new ForbiddenException("TOKEN_WRONG_ELECTION", "Token is not valid for this election");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ConflictException("TOKEN_EXPIRED", "Token has expired");
        }
        if (token.isConsumed()) {
            throw new ConflictException("TOKEN_ALREADY_USED", "Token already used");
        }

        VoterListModel voter = token.getVoter();

        // ensure token voter matches authenticated email (prevents token theft)
        if (!voter.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new ForbiddenException("TOKEN_NOT_FOR_USER", "Token is not for this user");
        }
        if (voter.isBlocked()) {
            throw new ForbiddenException("VOTER_BLOCKED", "You are blocked from voting");
        }
        if (voter.isHasVoted()) {
            throw new ConflictException("ALREADY_VOTED", "You have already voted");
        }

        // create receipt
        String receiptToken = hashService.generateOneTimeToke(electionId, candidateId);

        VoteModel vote = new VoteModel();
        vote.setElectionId(election);
        vote.setCandidateId(candidate);
        vote.setCreatedAt(LocalDateTime.now());
        vote.setReceiptHashToken(receiptToken);
        voteRepo.save(vote);

        // atomic consume
        tokenService.consumeByTokenId(tokenId);

        // mark voter voted
        voter.setHasVoted(true);
        voter.setVotedAt(LocalDateTime.now());
        voterRepo.save(voter);

        safeAuditService.audit(AuditLogsRequest.builder()
                .actor(user.getId().toString())
                .electionId(electionId.toString())
                .organizationId(election.getOrganization().getId().toString())
                .entityId("VoteModel")
                .action(AuditActions.VOTE_CAST.name())
                .status(ActionStatus.SUCCESS.name())
                .details("Vote cast successfully")
                .createdAt(LocalDateTime.now())
                .build());

        return receiptToken;
    }
}
