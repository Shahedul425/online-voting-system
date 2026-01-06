package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.VoteModel;
import com.example.demo.Repositories.CandidateListRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
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
    private final OneTimeTokenService oneTimeTokenService;
    private final ElectionModelRepository electionModelRepository;
    private final VoteModelRepository voteModelRepository;
    private final CandidateListRepository candidateListRepository;
    private final HashService hashService;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;

    @Override
    @Transactional
    public String commitVote(UUID electionId, UUID candidateId, String tokenId) {
        boolean isTokenValid = oneTimeTokenService.validateToken(tokenId);
        String reciptToken = hashService.generateOneTimeToke(electionId, candidateId);
        CandidateListModel candidateListModel = candidateListRepository.findById(candidateId).orElse(null);
        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        try {
            if (!isTokenValid) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .entityId("VoteModel")
                                .action(AuditActions.VOTE_CAST.toString())
                                .status(ActionStatus.FAILED.toString())
                                .details("Vote Casting Failed Due To Invalid Token: "+tokenId)
                                .build()
                );
                throw new RuntimeException("Invalid token");

            }
            if (electionModel == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .entityId("VoteModel")
                                .action(AuditActions.VOTE_CAST.toString())
                                .status(ActionStatus.FAILED.toString())
                                .details("Vote Casting Failed Due To Election not Found: "+electionId)
                                .build()
                );
                throw new RuntimeException("Election not found");

            }
            if (candidateListModel == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .organizationId(electionModel.getOrganization().getId().toString())
                                .createdAt(LocalDateTime.now())
                                .entityId("VoteModel")
                                .action(AuditActions.VOTE_CAST.toString())
                                .status(ActionStatus.FAILED.toString())
                                .details("Vote Casting Failed Due To Candidate Id: ")
                                .build()
                );
                throw new RuntimeException("Candidate list not found");

            }
            VoteModel voteModel = new VoteModel();
            voteModel.setCandidateId(candidateListModel);
            voteModel.setElectionId(electionModel);
            voteModel.setCreatedAt(LocalDateTime.now());
            voteModel.setReceiptHashToken(reciptToken);
            voteModelRepository.save(voteModel);
            oneTimeTokenService.cosumeToken(UUID.fromString(tokenId));

            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .electionId(electionModel.getId().toString())
                            .organizationId(electionModel.getOrganization().getId().toString())
                            .createdAt(LocalDateTime.now())
                            .entityId("VoteModel")
                            .action(AuditActions.VOTE_CAST.toString())
                            .status(ActionStatus.SUCCESS.toString())
                            .details("Vote Casting Successfully finished")
                            .build()
            );
            return reciptToken;
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .electionId(electionModel.getId().toString())
                            .organizationId(electionModel.getOrganization().getId().toString())
                            .createdAt(LocalDateTime.now())
                            .entityId("VoteModel")
                            .action(AuditActions.VOTE_CAST.toString())
                            .status(ActionStatus.FAILED.toString())
                            .details("Vote Casting Failed: "+ e.getMessage())
                            .build()
            );
            throw e;
        }
    }
}
