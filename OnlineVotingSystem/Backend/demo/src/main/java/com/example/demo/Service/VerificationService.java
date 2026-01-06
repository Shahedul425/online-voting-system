package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DTO.TokenDTO;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.VerificationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService implements VerificationServiceInterface {
    private final SafeAuditService auditService;
    private final UserInfoService userService;
    private final VoterListModelRepository volterListModelRepository;
    private final ElectionModelRepository electionModelRepository;
    private final OneTimeTokenService oneTimeTokenService;
    private final VerificationAttemptService verificationAttemptService;
    private final  UserInfoService userInfoService;
    @Override
    public TokenDTO verfication(String voterId, String electionId) {

        UUID requestId = UUID.randomUUID();
        UUID electionId1 = UUID.fromString(electionId);
        OneTokenModel token = null;
        ElectionModel electionModel = electionModelRepository.findById(electionId1).orElse(null);
        try {
            if (electionModel == null) {
                auditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .action(AuditActions.VOTER_VERIFICATION.toString())
                                .status(ActionStatus.FAILED.toString())
                                .details("Voter verification failed due to No Responding Election")
                                .entityId("None")
                                .build()
                );
                throw new RuntimeException("Election not found");
            }
            boolean eligible;

            UserModel user = userInfoService.getCurrentUser();
            Optional<VoterListModel> voter = volterListModelRepository.findByElectionIdAndVoterIdAndEmail(electionId1, voterId, user.getEmail());
//        if(voter == null) {
//            throw new RuntimeException("Voter not found");
//        }
            if (voter.isPresent()) {
                voter.get().setVerified(true);
                eligible = !voter.get().isBlocked() && !voter.get().isHasVoted();
                volterListModelRepository.save(voter.get());
                auditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .action(AuditActions.VOTER_VERIFICATION.toString())
                                .status(ActionStatus.SUCCESS.toString())
                                .details("Voter verification is Success and Voter is Eligible to Vote")
                                .entityId("VoterList")
                                .build()
                );
            } else {
                eligible = false;
                auditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .action(AuditActions.VOTER_VERIFICATION.toString())
                                .status(ActionStatus.FAILED.toString())
                                .details("Voter verification failed because voter is not eligible to vote")
                                .entityId("None")
                                .build()
                );
            }
            if (eligible) {
                token = oneTimeTokenService.issueToken(
                        String.valueOf(requestId),
                        electionModel, voter.get());
                auditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .action(AuditActions.VOTER_VERIFICATION.toString())
                                .status(ActionStatus.SUCCESS.toString())
                                .details("One Time token Issued to Voter to vote")
                                .entityId("None")
                                .build()
                );
            }

            return TokenDTO.builder()
                    .expiryTime(token.getExpiresAt())
                    .tokenId(token.getTokenId())
                    .build();
        }catch (BusinessException e){
            auditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userService.getCurrentUser().getId().toString())
                            .electionId(electionModel.getId().toString())
                            .organizationId(electionModel.getOrganization().getId().toString())
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.VOTER_VERIFICATION.toString())
                            .status(ActionStatus.FAILED.toString())
                            .details("Voter verification failed due to: "+e.getMessage())
                            .entityId("None")
                            .build()
            );
            throw e;
        }

    }

    @Override
    public boolean isEligible(String email, String voterId) {
        return false;
    }


}
