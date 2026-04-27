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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@RequiredArgsConstructor
public class VerificationService implements VerificationServiceInterface {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);

    private final SafeAuditService auditService;
    private final UserInfoService userInfoService;
    private final VoterListModelRepository voterRepo;
    private final ElectionModelRepository electionRepo;
    private final OneTimeTokenService tokenService;
    private final OtpMailService otpMailService;

    /**
     * Dev convenience: when true, the verify response echoes the tokenId in a
     * `devOtp` field so the UI can skip the email step during demos.
     * Never set to true in production.
     */
    @Value("${ovs.dev.return-otp:false}")
    private boolean returnOtpInResponse;

    @Override
    @Transactional
    public TokenDTO verfication(String voterId, String electionId) {

        UserModel user = userInfoService.getCurrentUser();
        UUID eId = Ids.uuid(electionId, "electionId");

        ElectionModel election = electionRepo.findById(eId)
                .orElseThrow(() -> {
                    // ✅ rejection/failure: election not found
                    log.warn("Voter verification failed: election not found {} {}",
                            kv("action", "VOTER_VERIFICATION"),
                            kv("electionId", electionId)
                    );

                    // ✅ audit for admins
                    auditService.audit(audit(user, null, user.getOrganization().getId(),
                            AuditActions.VOTER_VERIFICATION, ActionStatus.FAILED,
                            "Election not found"));

                    return new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
                });

        if (!election.getOrganization().getId().equals(user.getOrganization().getId())) {
            // ✅ security boundary violation
            log.warn("Voter verification blocked: cross-org access {} {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString()),
                    kv("userOrgId", user.getOrganization().getId().toString())
            );

            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.FAILED,
                    "Cross-org verification attempt"));

            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        if (election.getStatus() != ElectionStatus.running) {
            // ✅ rejected: not running
            log.warn("Voter verification rejected: election not running {} {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name())
            );

            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.REJECTED,
                    "Election not running: " + election.getStatus().name()));

            throw new ConflictException("ELECTION_NOT_RUNNING", "Election is not running");
        }

        Optional<VoterListModel> voterOpt =
                voterRepo.findByElectionIdAndVoterIdAndEmail(eId, voterId, user.getEmail());

        if (voterOpt.isEmpty()) {
            // ✅ rejected: not in voter list or mismatch (don’t log voterId/email)
            log.warn("Voter verification rejected: voter mismatch {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );

            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.REJECTED,
                    "Voter not found or email mismatch"));

            throw new ForbiddenException("VOTER_NOT_FOUND", "Voter not found for this email");
        }

        VoterListModel voter = voterOpt.get();
        voter.setVerified(true);

        boolean eligible = !voter.isBlocked() && !voter.isHasVoted();
        voterRepo.save(voter);

        if (!eligible) {
            // ✅ rejected: not eligible (blocked/hasVoted)
            log.warn("Voter verification rejected: voter not eligible {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );

            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.REJECTED,
                    "Voter not eligible (blocked or already voted)"));

            throw new ConflictException("VOTER_NOT_ELIGIBLE", "You are not eligible to vote");
        }

        // business correlation id (keep)
        String tokenRefId = "tok-" + UUID.randomUUID().toString().substring(0, 10);

        OneTokenModel token = tokenService.issueToken(tokenRefId, election, voter);

        // Send the OTP email — best-effort; verification still succeeds even
        // when SMTP is not configured (the devOtp echo below covers demos).
        // Wrapped defensively: a mail bean misconfig must never block voting.
        try {
            if (otpMailService != null) {
                otpMailService.sendOtp(user.getEmail(), token.getTokenId(),
                        election.getName(), token.getExpiresAt());
            }
        } catch (Exception mailEx) {
            log.warn("OTP mail dispatch failed (non-fatal): {}", mailEx.getMessage());
        }

        // ✅ no INFO success log to Loki (noise). Keep DB audit.
        auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                AuditActions.VOTER_VERIFICATION, ActionStatus.SUCCESS,
                "Token issued for voting"));

        TokenDTO dto = TokenDTO.builder()
                .tokenId(token.getTokenId())
                .expiryTime(token.getExpiresAt())
                .build();

        if (returnOtpInResponse) {
            // ⚠ DEV ONLY: never turn this on in prod — tokens must reach the
            //    user out-of-band (email/SMS), not via the API response body.
            dto.setDevOtp(token.getTokenId());
        }

        return dto;
    }

    @Override
    public boolean isEligible(String email, String voterId) {
        return false;
    }

    /**
     * Email-driven variant of {@link #verfication(String, String)}.
     *
     * The original flow required the caller to supply the voter-list ID
     * assigned at CSV upload time, which voters don't typically remember.
     * Here we use the JWT-authenticated email to resolve the voter-list row
     * directly. All other checks (org-scope, election running, eligibility,
     * token issuance) remain identical.
     */
    @Transactional
    public TokenDTO verifyByEmail(String electionId) {
        UserModel user = userInfoService.getCurrentUser();
        UUID eId = Ids.uuid(electionId, "electionId");

        ElectionModel election = electionRepo.findById(eId)
                .orElseThrow(() -> {
                    log.warn("Voter verification failed: election not found {} {}",
                            kv("action", "VOTER_VERIFICATION"),
                            kv("electionId", electionId)
                    );
                    auditService.audit(audit(user, null, user.getOrganization().getId(),
                            AuditActions.VOTER_VERIFICATION, ActionStatus.FAILED,
                            "Election not found"));
                    return new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
                });

        if (!election.getOrganization().getId().equals(user.getOrganization().getId())) {
            log.warn("Voter verification blocked: cross-org access {} {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "FAILED"),
                    kv("electionId", election.getId().toString()),
                    kv("userOrgId", user.getOrganization().getId().toString())
            );
            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.FAILED,
                    "Cross-org verification attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "Forbidden");
        }

        if (election.getStatus() != ElectionStatus.running) {
            log.warn("Voter verification rejected: election not running {} {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString()),
                    kv("currentStatus", election.getStatus().name())
            );
            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.REJECTED,
                    "Election not running: " + election.getStatus().name()));
            throw new ConflictException("ELECTION_NOT_RUNNING", "Election is not running");
        }

        VoterListModel voter = voterRepo.findByElectionIdAndEmailIgnoreCase(eId, user.getEmail())
                .orElseThrow(() -> {
                    log.warn("Voter verification rejected: not on voter list {} {} {}",
                            kv("action", "VOTER_VERIFICATION"),
                            kv("status", "REJECTED"),
                            kv("electionId", election.getId().toString())
                    );
                    auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                            AuditActions.VOTER_VERIFICATION, ActionStatus.REJECTED,
                            "Voter not on the list for this election"));
                    return new ForbiddenException("VOTER_NOT_FOUND", "You are not on the voter list for this election");
                });

        voter.setVerified(true);
        boolean eligible = !voter.isBlocked() && !voter.isHasVoted();
        voterRepo.save(voter);

        if (!eligible) {
            log.warn("Voter verification rejected: voter not eligible {} {} {}",
                    kv("action", "VOTER_VERIFICATION"),
                    kv("status", "REJECTED"),
                    kv("electionId", election.getId().toString())
            );
            auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                    AuditActions.VOTER_VERIFICATION, ActionStatus.REJECTED,
                    "Voter not eligible (blocked or already voted)"));
            throw new ConflictException("VOTER_NOT_ELIGIBLE", "You are not eligible to vote");
        }

        String tokenRefId = "tok-" + UUID.randomUUID().toString().substring(0, 10);
        OneTokenModel token = tokenService.issueToken(tokenRefId, election, voter);

        // Fire-and-forget mail. The send is best-effort; if SMTP isn't wired
        // (or rejects auth) the user can still see the OTP via the dev echo
        // path below. We never block verification on mail.
        try {
            if (otpMailService != null) {
                otpMailService.sendOtp(user.getEmail(), token.getTokenId(),
                        election.getName(), token.getExpiresAt());
            }
        } catch (Exception mailEx) {
            log.warn("OTP mail dispatch failed (non-fatal): {}", mailEx.getMessage());
        }

        auditService.audit(audit(user, election.getId(), user.getOrganization().getId(),
                AuditActions.VOTER_VERIFICATION, ActionStatus.SUCCESS,
                "Token issued for voting (email-driven)"));

        TokenDTO dto = TokenDTO.builder()
                .tokenId(token.getTokenId())
                .expiryTime(token.getExpiresAt())
                .build();

        if (returnOtpInResponse) {
            dto.setDevOtp(token.getTokenId());
        }
        return dto;
    }

    // --- helper: consistent audit builder with requestId bridge ---
    private AuditLogsRequest audit(UserModel actor,
                                   UUID electionId,
                                   UUID orgId,
                                   AuditActions action,
                                   ActionStatus status,
                                   String details) {

        return AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(electionId != null ? electionId.toString() : null)
                .organizationId(orgId != null ? orgId.toString() : null)
                .action(action.name())
                .status(status.name())
                .entityId("Verification")
                .details(details)
                .requestId(MDC.get("requestId")) // ✅ bridge (critical)
                // .traceId(MDC.get("traceId"))   // optional if you keep it
                .createdAt(LocalDateTime.now())
                .build();
    }
}
