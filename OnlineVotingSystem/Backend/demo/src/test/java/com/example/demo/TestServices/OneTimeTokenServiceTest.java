package com.example.demo.TestServices;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.*;
import com.example.demo.Repositories.OneTimeTokenModelRepository;
import com.example.demo.Service.OneTimeTokenService;
import com.example.demo.Service.SafeAuditService;
import com.example.demo.Service.UserInfoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OneTimeTokenServiceTest {
    @Mock OneTimeTokenModelRepository tokenRepo;
    @Mock SafeAuditService auditService;
    @Mock UserInfoService userService;

    @InjectMocks
    OneTimeTokenService oneTimeTokenService;

    @BeforeEach
    void setUp() {
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }


    private OrganizationModel org(UUID orgId){
        OrganizationModel org = new OrganizationModel();
        org.setId(orgId);
        return org;
    }
    private UserModel user(UUID orgId) {
        UserModel user = new UserModel();
        user.setId(UUID.randomUUID());
        user.setOrganization(org(orgId));
        return user;
    }
    private ElectionModel election(UUID orgId,UUID electionId) {
        ElectionModel election = new ElectionModel();
        election.setId(electionId);
        election.setOrganization(org(orgId));
        return election;
    }
    private VoterListModel voter(UUID voterId) {
        VoterListModel v = new VoterListModel();
        v.setId(voterId);
        return v;
    }

    @Test
    void oneTimeTokenServiceShouldIssueToken_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID voterId = UUID.randomUUID();
        var user = user(orgId);
        when(userService.getCurrentUser()).thenReturn(user);
        var election = election(orgId, electionId);
        String tokenRefId = "business-ref-123";
        MDC.put("requestId", "http-req-abc");

        when(tokenRepo.save(any(OneTokenModel.class))).thenAnswer(invocation ->
        {
           OneTokenModel t =  invocation.getArgument(0);
           t.setId(UUID.randomUUID());
           return t;
        });
        OneTokenModel saved = oneTimeTokenService.issueToken(tokenRefId, election, voter(voterId));

        assertNotNull(saved);
        assertNotNull(saved.getId(), "Saved token should have DB id set in mock answer");
        assertNotNull(saved.getTokenId(), "TokenId should be generated");
        assertEquals(tokenRefId, saved.getRequestId(), "requestId field stores tokenRefId (business ref id)");
        assertEquals(election, saved.getElection());
        assertEquals(voterId, saved.getVoter().getId());
        assertFalse(saved.isConsumed());

        assertNotNull(saved.getIssuedAt());
        assertNotNull(saved.getExpiresAt());
        assertTrue(saved.getExpiresAt().isAfter(saved.getIssuedAt()));
        // approximately 10 minutes (avoid brittle exact checks)
        assertTrue(saved.getExpiresAt().isAfter(saved.getIssuedAt().plusMinutes(9)));

        verify(tokenRepo, times(1)).save(any(OneTokenModel.class));

        ArgumentCaptor<AuditLogsRequest> auditCaptor = ArgumentCaptor.forClass(AuditLogsRequest.class);
        verify(auditService, times(1)).audit(auditCaptor.capture());

        AuditLogsRequest req = auditCaptor.getValue();
        assertNotNull(req);

        // actor included
        assertEquals(user.getId().toString(), req.getActor());
        // election + org included
        assertEquals(electionId.toString(), req.getElectionId());
        assertEquals(orgId.toString(), req.getOrganizationId());
        // requestId bridged from MDC
        assertEquals("http-req-abc", req.getRequestId());

        assertNotNull(req.getCreatedAt());
        assertTrue(req.getDetails().contains(tokenRefId));

    }

    @Test
    void issueToken_actorNull_stillAudits_withNullActor() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        ElectionModel election = election(orgId, electionId);
        VoterListModel voter = voter(UUID.randomUUID());

        when(userService.getCurrentUser()).thenReturn(null);
        when(tokenRepo.save(any(OneTokenModel.class))).thenAnswer(invocation -> {
            OneTokenModel t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        oneTimeTokenService.issueToken("ref-x", election, voter);

        ArgumentCaptor<AuditLogsRequest> auditCaptor = ArgumentCaptor.forClass(AuditLogsRequest.class);
        verify(auditService).audit(auditCaptor.capture());
        assertNull(auditCaptor.getValue().getActor());
    }

    // -------------------- cosumeToken(UUID) --------------------
    // Note: service method name is "cosumeToken" (typo). Tests call the same.

    @Test
    void cosumeToken_success_whenRepositoryUpdatesOneRow() {
        UUID tokenEntityId = UUID.randomUUID();
        when(tokenRepo.consumeIfNotConsumed(tokenEntityId)).thenReturn(1);

        assertDoesNotThrow(() -> oneTimeTokenService.cosumeToken(tokenEntityId));

        verify(tokenRepo, times(1)).consumeIfNotConsumed(tokenEntityId);
    }

    @Test
    void cosumeToken_throwsConflict_whenAlreadyConsumedOrNotFound() {
        UUID tokenEntityId = UUID.randomUUID();
        when(tokenRepo.consumeIfNotConsumed(tokenEntityId)).thenReturn(0);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> oneTimeTokenService.cosumeToken(tokenEntityId));

        // These depend on your ConflictException implementation; adjust if needed.
        assertTrue(ex.getMessage().contains("Token is already consumed") || ex.getMessage().contains("TOKEN_ALREADY_USED"));

        verify(tokenRepo, times(1)).consumeIfNotConsumed(tokenEntityId);
    }

    // -------------------- consumeByTokenId(String) --------------------

    @Test
    void consumeByTokenId_success_consumesWhenFoundAndNotConsumed() {
        String tokenId = "token-abc";

        OneTokenModel token = new OneTokenModel();
        UUID tokenEntityId = UUID.randomUUID();
        token.setId(tokenEntityId);
        token.setTokenId(tokenId);

        when(tokenRepo.findByTokenId(tokenId)).thenReturn(Optional.of(token));
        when(tokenRepo.consumeIfNotConsumed(tokenEntityId)).thenReturn(1);

        assertDoesNotThrow(() -> oneTimeTokenService.consumeByTokenId(tokenId));

        verify(tokenRepo).findByTokenId(tokenId);
        verify(tokenRepo).consumeIfNotConsumed(tokenEntityId);
    }

    @Test
    void consumeByTokenId_throwsNotFound_whenTokenDoesNotExist() {
        String tokenId = "missing-token";
        when(tokenRepo.findByTokenId(tokenId)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> oneTimeTokenService.consumeByTokenId(tokenId));

        assertTrue(ex.getMessage().contains("Token not found") || ex.getMessage().contains("TOKEN_NOT_FOUND"));

        verify(tokenRepo).findByTokenId(tokenId);
        verify(tokenRepo, never()).consumeIfNotConsumed(any());
    }

    @Test
    void consumeByTokenId_throwsConflict_whenAlreadyConsumed() {
        String tokenId = "token-used";

        OneTokenModel token = new OneTokenModel();
        UUID tokenEntityId = UUID.randomUUID();
        token.setId(tokenEntityId);
        token.setTokenId(tokenId);

        when(tokenRepo.findByTokenId(tokenId)).thenReturn(Optional.of(token));
        when(tokenRepo.consumeIfNotConsumed(tokenEntityId)).thenReturn(0);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> oneTimeTokenService.consumeByTokenId(tokenId));

        assertTrue(ex.getMessage().contains("Token already consumed") || ex.getMessage().contains("TOKEN_ALREADY_USED"));

        verify(tokenRepo).findByTokenId(tokenId);
        verify(tokenRepo).consumeIfNotConsumed(tokenEntityId);
    }

    // -------------------- validateToken(String) --------------------

    @Test
    void validateToken_returnsFalse_whenNotFound() {
        when(tokenRepo.findByTokenId("nope")).thenReturn(Optional.empty());

        assertFalse(oneTimeTokenService.validateToken("nope"));

        verify(tokenRepo).findByTokenId("nope");
    }

    @Test
    void validateToken_returnsFalse_whenExpired() {
        OneTokenModel token = new OneTokenModel();
        token.setTokenId("t1");
        token.setConsumed(false);
        token.setExpiresAt(LocalDateTime.now().minusSeconds(1));

        when(tokenRepo.findByTokenId("t1")).thenReturn(Optional.of(token));

        assertFalse(oneTimeTokenService.validateToken("t1"));
    }

    @Test
    void validateToken_returnsFalse_whenConsumed() {
        OneTokenModel token = new OneTokenModel();
        token.setTokenId("t2");
        token.setConsumed(true);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        when(tokenRepo.findByTokenId("t2")).thenReturn(Optional.of(token));

        assertFalse(oneTimeTokenService.validateToken("t2"));
    }

    @Test
    void validateToken_returnsTrue_whenNotExpired_andNotConsumed() {
        OneTokenModel token = new OneTokenModel();
        token.setTokenId("t3");
        token.setConsumed(false);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        when(tokenRepo.findByTokenId("t3")).thenReturn(Optional.of(token));

        assertTrue(oneTimeTokenService.validateToken("t3"));
    }


}
