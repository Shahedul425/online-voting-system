package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OneTimeTokenModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.TokenServiceInterface;
import jakarta.el.ELClass;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OneTimeTokenService implements TokenServiceInterface {
    private final ElectionModelRepository electionModelRepository;
    private final VoterListModelRepository voterListModelRepository;
    private final OneTimeTokenModelRepository oneTimeTokenModelRepository;
    private final SafeAuditService auditService;
    private final UserInfoService userService;
    @Override
    public OneTokenModel issueToken(String requestId, ElectionModel electionModel, VoterListModel voterId) {
//        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
//        if (electionModel == null) {
//            throw new RuntimeException("Election not found");
//        }
//        VoterListModel voter = voterListModelRepository.findById(voterId).orElse(null);
//        if(voter == null) {
//            throw new RuntimeException("Voter not found");
//        }

        try {
            OneTokenModel oneTokenModel = new OneTokenModel();
            oneTokenModel.setIssuedAt(LocalDateTime.now());
            oneTokenModel.setElection(electionModel);
            oneTokenModel.setConsumed(false);
            oneTokenModel.setVoter(voterId);
            oneTokenModel.setTokenId(UUID.randomUUID().toString());
            oneTokenModel.setRequestId(requestId);
            oneTokenModel.setExpiresAt(LocalDateTime.now().plusMinutes(10));
            oneTimeTokenModelRepository.save(oneTokenModel);
            auditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userService.getCurrentUser().getId().toString())
                            .electionId(electionModel.getId().toString())
                            .organizationId(electionModel.getOrganization().getId().toString())
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.ISSUE_ONETIME_TOKEN.toString())
                            .status(ActionStatus.SUCCESS.toString())
                            .details("OneTimeToken issued Successfully")
                            .entityId("OneTimeTokenModel")
                            .build()
            );

            return oneTokenModel;
        }catch (BusinessException e){
            auditService.audit(
                    AuditLogsRequest.builder()
                    .actor(userService.getCurrentUser().getId().toString())
                    .electionId(electionModel.getId().toString())
                    .organizationId(electionModel.getOrganization().getId().toString())
                    .createdAt(LocalDateTime.now())
                    .action(AuditActions.ISSUE_ONETIME_TOKEN.toString())
                    .status(ActionStatus.FAILED.toString())
                    .details("OneTimeToken failed to issue: " + e.getMessage())
                    .entityId("OneTimeTokenModel")
                    .build()
            );
            throw e;
        }
    }

    @Override
    public void cosumeToken(UUID tokenId) {
        OneTokenModel oneTokenModel = oneTimeTokenModelRepository.findById(tokenId).orElse(null);
        try {
            if (oneTokenModel == null) {
                auditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userService.getCurrentUser().getId().toString())
                                .electionId(oneTokenModel.getElection().getId().toString())
                                .organizationId(oneTokenModel.getElection().getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .action(AuditActions.CONSUME_ONETIME_TOKEN.toString())
                                .status(ActionStatus.FAILED.toString())
                                .details("OneTimeToken Consumption Failed due to token not found: " + tokenId)
                                .entityId("OneTimeTokenModel")
                                .build()
                );
                throw new RuntimeException("OneTimeToken not found");

            }

            oneTokenModel.setConsumed(true);
            oneTimeTokenModelRepository.save(oneTokenModel);
            auditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userService.getCurrentUser().getId().toString())
                            .electionId(oneTokenModel.getElection().getId().toString())
                            .organizationId(oneTokenModel.getElection().getOrganization().getId().toString())
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.CONSUME_ONETIME_TOKEN.toString())
                            .status(ActionStatus.SUCCESS.toString())
                            .details("OneTimeToken Consumed Successfully")
                            .entityId("OneTimeTokenModel")
                            .build()
            );

        }catch (BusinessException e){
            auditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userService.getCurrentUser().getId().toString())
                            .electionId(oneTokenModel.getElection().getId().toString())
                            .organizationId(oneTokenModel.getElection().getOrganization().getId().toString())
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.CONSUME_ONETIME_TOKEN.toString())
                            .status(ActionStatus.FAILED.toString())
                            .details("OneTimeToken Consumption Failed due to token not found: "+e.getMessage())
                            .entityId("OneTimeTokenModel")
                            .build()
            );
        }
    }

    @Override
    public boolean validateToken(String tokenId) {
        OneTokenModel oneTokenModel = oneTimeTokenModelRepository.findByRequestId(tokenId);
        return oneTokenModel != null && !oneTokenModel.getExpiresAt().isBefore(LocalDateTime.now()) && !oneTokenModel.isConsumed();
    }
}
