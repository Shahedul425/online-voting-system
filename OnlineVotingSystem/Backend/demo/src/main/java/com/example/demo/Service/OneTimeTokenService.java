package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.OneTimeTokenModelRepository;
import com.example.demo.ServiceInterface.TokenServiceInterface;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
public class OneTimeTokenService implements TokenServiceInterface {

    private static final Logger log = LoggerFactory.getLogger(OneTimeTokenService.class);

    private final OneTimeTokenModelRepository tokenRepo;
    private final SafeAuditService auditService;
    private final UserInfoService userService;

    private static final SecureRandom RNG = new SecureRandom();

    /**
     * Returns a fresh 6-digit OTP string. Retries on the very rare collision
     * with an outstanding token. The collision probability for 1M codes vs
     * a tiny table of in-flight tokens (typically < 1000) is negligible.
     */
    private String generateUniqueSixDigitOtp() {
        for (int i = 0; i < 8; i++) {
            String candidate = String.format("%06d", RNG.nextInt(1_000_000));
            if (tokenRepo.findByTokenId(candidate).isEmpty()) {
                return candidate;
            }
        }
        // Worst case (extremely unlikely): fall back to a longer code so the
        // request still succeeds. The voter will see something like "123456-9".
        return String.format("%06d", RNG.nextInt(1_000_000)) + "-" + RNG.nextInt(10);
    }

    /**
     * tokenRefId = business correlation id for this issuance (NOT http requestId)
     *
     * The {@code tokenId} field stored on the model is the 6-digit OTP we
     * e-mail the voter. The voter types it into the ballot UI and the cast
     * endpoint looks the token up by this same string.
     */
    @Override
    public OneTokenModel issueToken(String tokenRefId, ElectionModel election, VoterListModel voter) {
        UserModel actor = userService.getCurrentUser();

        OneTokenModel t = new OneTokenModel();
        t.setIssuedAt(LocalDateTime.now());
        t.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        t.setElection(election);
        t.setVoter(voter);
        t.setConsumed(false);
        t.setTokenId(generateUniqueSixDigitOtp());
        t.setRequestId(tokenRefId); // business ref id

        OneTokenModel saved = tokenRepo.save(t);

        // ✅ DB audit for election integrity (include http requestId)
        auditService.audit(AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(election.getId().toString())
                .organizationId(election.getOrganization().getId().toString())
                .action(AuditActions.ISSUE_ONETIME_TOKEN.name())
                .status(ActionStatus.SUCCESS.name())
                .entityId("OneTimeTokenModel")
                .details("One-time token issued. tokenRefId=" + tokenRefId)
                .requestId(MDC.get("requestId")) // ✅ bridge
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Override
    @Transactional
    public void cosumeToken(UUID tokenEntityId) {
        int updated = tokenRepo.consumeIfNotConsumed(tokenEntityId);
        if (updated == 0) {
            log.warn("Consume token rejected {} {}",
                    kv("action", "CONSUME_ONETIME_TOKEN"),
                    kv("status", "REJECTED")
            );
            throw new ConflictException("TOKEN_ALREADY_USED_OR_NOT_FOUND", "Token is already consumed or not found");
        }
    }

    @Transactional
    public void consumeByTokenId(String tokenId) {
        OneTokenModel token = tokenRepo.findByTokenId(tokenId)
                .orElseThrow(() -> {
                    log.warn("Consume token failed: not found {} {}",
                            kv("action", "CONSUME_ONETIME_TOKEN"),
                            kv("status", "FAILED")
                    );
                    return new NotFoundException("TOKEN_NOT_FOUND", "Token not found");
                });

        int updated = tokenRepo.consumeIfNotConsumed(token.getId());
        if (updated == 0) {
            log.warn("Consume token rejected: already consumed {} {}",
                    kv("action", "CONSUME_ONETIME_TOKEN"),
                    kv("status", "REJECTED")
            );
            throw new ConflictException("TOKEN_ALREADY_USED", "Token already consumed");
        }
    }

    @Override
    public boolean validateToken(String tokenId) {
        OneTokenModel t = tokenRepo.findByTokenId(tokenId).orElse(null);
        return t != null && !t.getExpiresAt().isBefore(LocalDateTime.now()) && !t.isConsumed();
    }
}
