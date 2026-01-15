package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DTO.TokenDTO;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.*;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.VerificationServiceInterface;
import com.example.demo.Util.Ids;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class VerificationService implements VerificationServiceInterface {

    private final SafeAuditService auditService;
    private final UserInfoService userInfoService;
    private final VoterListModelRepository voterRepo;
    private final ElectionModelRepository electionRepo;
    private final OneTimeTokenService tokenService;

    @Override
    @Transactional
    public TokenDTO verfication(String voterId, String electionId) {

        UserModel user = userInfoService.getCurrentUser();
        UUID eId = Ids.uuid(electionId, "electionId");

        ElectionModel election = electionRepo.findById(eId)
                .orElseThrow(() -> new NotFoundException("ELECTION_NOT_FOUND", "Election not found"));

        if (!election.getOrganization().getId().equals(user.getOrganization().getId())) {
            auditService.audit(AuditLogsRequest.builder()
                    .actor(user.getId().toString())
                    .electionId(election.getId().toString())
                    .organizationId(user.getOrganization().getId().toString())
                    .action(AuditActions.VOTER_VERIFICATION.name())
                    .status(ActionStatus.FAILED.name())
                    .entityId("Verification")
                    .details("Cross-org verification attempt")
                    .createdAt(LocalDateTime.now())
                    .build());
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        // Recommended integrity: only verify while running
        if (election.getStatus() != ElectionStatus.running) {
            throw new ConflictException("ELECTION_NOT_RUNNING", "Election is not running");
        }

        Optional<VoterListModel> voterOpt =
                voterRepo.findByElectionIdAndVoterIdAndEmail(eId, voterId, user.getEmail());

        if (voterOpt.isEmpty()) {
            auditService.audit(AuditLogsRequest.builder()
                    .actor(user.getId().toString())
                    .electionId(election.getId().toString())
                    .organizationId(user.getOrganization().getId().toString())
                    .action(AuditActions.VOTER_VERIFICATION.name())
                    .status(ActionStatus.REJECTED.name())
                    .entityId("VoterList")
                    .details("Voter not found or email mismatch")
                    .createdAt(LocalDateTime.now())
                    .build());
            throw new ForbiddenException("VOTER_NOT_FOUND", "Voter not found for this email");
        }

        VoterListModel voter = voterOpt.get();
        voter.setVerified(true);

        boolean eligible = !voter.isBlocked() && !voter.isHasVoted();
        voterRepo.save(voter);

        if (!eligible) {
            auditService.audit(AuditLogsRequest.builder()
                    .actor(user.getId().toString())
                    .electionId(election.getId().toString())
                    .organizationId(user.getOrganization().getId().toString())
                    .action(AuditActions.VOTER_VERIFICATION.name())
                    .status(ActionStatus.REJECTED.name())
                    .entityId("VoterList")
                    .details("Voter not eligible (blocked or already voted)")
                    .createdAt(LocalDateTime.now())
                    .build());
            throw new ConflictException("VOTER_NOT_ELIGIBLE", "You are not eligible to vote");
        }

        String requestId = UUID.randomUUID().toString();
        OneTokenModel token = tokenService.issueToken(requestId, election, voter);

        auditService.audit(AuditLogsRequest.builder()
                .actor(user.getId().toString())
                .electionId(election.getId().toString())
                .organizationId(user.getOrganization().getId().toString())
                .action(AuditActions.VOTER_VERIFICATION.name())
                .status(ActionStatus.SUCCESS.name())
                .entityId("OneTimeToken")
                .details("Token issued for voting")
                .createdAt(LocalDateTime.now())
                .build());

        return TokenDTO.builder()
                .tokenId(token.getTokenId())
                .expiryTime(token.getExpiresAt())
                .build();
    }

    @Override
    public boolean isEligible(String email, String voterId) {
        throw new BadRequestException("NOT_IMPLEMENTED", "Not implemented yet");
    }
}
