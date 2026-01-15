package com.example.demo.Service;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OneTimeTokenModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.TokenServiceInterface;
import jakarta.el.ELClass;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class OneTimeTokenService implements TokenServiceInterface {

    private final OneTimeTokenModelRepository tokenRepo;
    private final SafeAuditService auditService;
    private final UserInfoService userService;

    @Override
    public OneTokenModel issueToken(String requestId, ElectionModel election, VoterListModel voter) {
        UserModel actor = userService.getCurrentUser();

        OneTokenModel t = new OneTokenModel();
        t.setIssuedAt(LocalDateTime.now());
        t.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        t.setElection(election);
        t.setVoter(voter);
        t.setConsumed(false);
        t.setTokenId(UUID.randomUUID().toString());
        t.setRequestId(requestId);

        OneTokenModel saved = tokenRepo.save(t);

        auditService.audit(AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(election.getId().toString())
                .organizationId(election.getOrganization().getId().toString())
                .action(AuditActions.ISSUE_ONETIME_TOKEN.name())
                .status(ActionStatus.SUCCESS.name())
                .entityId("OneTimeTokenModel")
                .details("One-time token issued")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Override
    @Transactional
    public void cosumeToken(UUID tokenEntityId) {
        // atomic consume by entity ID (if you really want this signature)
        int updated = tokenRepo.consumeIfNotConsumed(tokenEntityId);
        if (updated == 0) {
            throw new ConflictException("TOKEN_ALREADY_USED_OR_NOT_FOUND", "Token is already consumed or not found");
        }
    }

    @Transactional
    public void consumeByTokenId(String tokenId) {
        OneTokenModel token = tokenRepo.findByTokenId(tokenId)
                .orElseThrow(() -> new NotFoundException("TOKEN_NOT_FOUND", "Token not found"));

        int updated = tokenRepo.consumeIfNotConsumed(token.getId());
        if (updated == 0) {
            throw new ConflictException("TOKEN_ALREADY_USED", "Token already consumed");
        }
    }

    @Override
    public boolean validateToken(String tokenId) {
        OneTokenModel t = tokenRepo.findByTokenId(tokenId).orElse(null);
        return t != null && !t.getExpiresAt().isBefore(LocalDateTime.now()) && !t.isConsumed();
    }
}
