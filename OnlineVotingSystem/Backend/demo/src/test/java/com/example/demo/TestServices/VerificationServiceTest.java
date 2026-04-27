package com.example.demo.TestServices;

import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.*;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.Service.OneTimeTokenService;
import com.example.demo.Service.OtpMailService;
import com.example.demo.Service.SafeAuditService;
import com.example.demo.Service.UserInfoService;
import com.example.demo.Service.VerificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VerificationServiceTest {

    @Mock
    SafeAuditService auditService;
    @Mock
    UserInfoService userInfoService;
    @Mock
    VoterListModelRepository voterRepo;
    @Mock
    ElectionModelRepository electionRepo;
    @Mock
    OneTimeTokenService tokenService;
    @Mock
    OtpMailService otpMailService;

    @InjectMocks
    VerificationService verificationService;

    @BeforeEach
    void setUp() {
        MDC.put("requestId", "mdc-request-id");
    }
    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    private OrganizationModel org(UUID orgId){
        OrganizationModel orgModel = new OrganizationModel();
        orgModel.setId(orgId);
        return orgModel;
    }

    private ElectionModel election(UUID electionId, UUID orgId, ElectionStatus status){
        ElectionModel electionModel = new ElectionModel();
        electionModel.setId(electionId);
        electionModel.setStatus(status);
        electionModel.setOrganization(org(orgId));
        return electionModel;
    }

    private UserModel userWithOrg(UUID orgId){
        UserModel userModel = new UserModel();
        userModel.setId(UUID.randomUUID());
        userModel.setOrganization(org(orgId));
        userModel.setEmail("test@test.com");
        return userModel;
    }

    private VoterListModel voter(UUID voterId,String email){
        VoterListModel voterListModel = new VoterListModel();
        voterListModel.setVoterId(String.valueOf(voterId));
        voterListModel.setEmail(email);
        return voterListModel;
    }

    @Test
    void verifcationService_verficationShouldFailAndThrowNotFoundException_whenElectionNotFound(){
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId,orgId,ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.empty());
        NotFoundException ex = assertThrows(NotFoundException.class,()->verificationService.verfication(voterId,electionId.toString()));
        assertEquals("ELECTION_NOT_FOUND", ex.getCode());

        verify(voterRepo,never()).save(any());
        verify(electionRepo,never()).save(any());
        verify(tokenService, never()).issueToken(anyString(), any(), any());

        verify(auditService,atLeastOnce()).audit(any());
    }

    @Test
    void verificationService_verificationShouldFailAndThrowForbiddenException_whenUserOrganizationDoesNotMatchWthElectionOrganization(){
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();
        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId,UUID.randomUUID(),ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        ForbiddenException ex = assertThrows(ForbiddenException.class,()->verificationService.verfication(voterId,electionId.toString()));
        assertEquals("CROSS_ORG_ACCESS", ex.getCode());
        verify(voterRepo,never()).save(any());
        verify(electionRepo,never()).save(any());
        verify(tokenService,never()).issueToken(anyString(), any(), any());
        verify(auditService,atLeastOnce()).audit(any());

    }

    @Test
    void verificationService_verificationShouldFailAndThrowConflictException_whenElectionIsNotRunning(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId,orgId,ElectionStatus.closed);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        ConflictException ex = assertThrows(ConflictException.class,()->verificationService.verfication(voterId,electionId.toString()));
        assertEquals("ELECTION_NOT_RUNNING",ex.getCode());

        verify(electionRepo,never()).save(any());
        verify(voterRepo,never()).save(any());
        verify(tokenService,never()).issueToken(anyString(),any(),any());
        verify(auditService,atLeastOnce()).audit(any());
    }
    @Test
    void verificationService_verificationShouldFailAndThrowForbiddenException_whenVoterIsNotInVoterList(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId,orgId,ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        when(voterRepo.findByElectionIdAndVoterIdAndEmail(electionId,voterId, user.getEmail())).thenReturn(Optional.empty());
        ForbiddenException ex = assertThrows(ForbiddenException.class,()->verificationService.verfication(voterId,electionId.toString()));
        assertEquals("VOTER_NOT_FOUND",ex.getCode());

        verify(electionRepo,never()).save(any());
        verify(voterRepo,never()).save(any());
        verify(tokenService,never()).issueToken(anyString(),any(),any());
        verify(auditService,atLeastOnce()).audit(any());
    }
    @Test
    void verificationService_shouldThrowForbidden_whenElectionIdDoesNotMatchVoterRecord() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();          // the election we verify against
        UUID otherElectionId = UUID.randomUUID();     // where the voter "actually" is (conceptually)
        String voterId = UUID.randomUUID().toString();

        var user = userWithOrg(orgId); // email = test@test.com
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId, orgId, ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        // voter not found for THIS electionId (even if they exist elsewhere)
        when(voterRepo.findByElectionIdAndVoterIdAndEmail(electionId, voterId, user.getEmail()))
                .thenReturn(Optional.empty());

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> verificationService.verfication(voterId, electionId.toString())
        );

        assertEquals("VOTER_NOT_FOUND", ex.getCode());

        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).issueToken(anyString(), any(), any());
        verify(auditService, atLeastOnce()).audit(any());
    }

    @Test
    void verificationService_shouldThrowForbidden_whenVoterIdDoesNotMatch() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();       // voterId provided
        String otherVoterId = UUID.randomUUID().toString();  // "real" voterId conceptually

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId, orgId, ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        // no record for provided voterId
        when(voterRepo.findByElectionIdAndVoterIdAndEmail(electionId, voterId, user.getEmail()))
                .thenReturn(Optional.empty());

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> verificationService.verfication(voterId, electionId.toString())
        );

        assertEquals("VOTER_NOT_FOUND", ex.getCode());

        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).issueToken(anyString(), any(), any());
        verify(auditService, atLeastOnce()).audit(any());
    }

    @Test
    void verificationService_shouldThrowConflictException_whenVoterIsNotEligible(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();
        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId, orgId, ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voter = new VoterListModel();
        voter.setVoterId(voterId);
        voter.setHasVoted(false);
        voter.setBlocked(true);
        when(voterRepo.findByElectionIdAndVoterIdAndEmail(electionId, voterId, user.getEmail())).thenReturn(Optional.of(voter));

        when(voterRepo.save(any(VoterListModel.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> verificationService.verfication(voterId, electionId.toString())
        );
        assertEquals("VOTER_NOT_ELIGIBLE", ex.getCode());
        ArgumentCaptor<VoterListModel> captor = ArgumentCaptor.forClass(VoterListModel.class);
        verify(voterRepo).save(captor.capture());
        assertTrue(captor.getValue().isVerified());
        verify(tokenService, never()).issueToken(anyString(), any(), any());
        verify(auditService, atLeastOnce()).audit(any());
    }
    @Test
    void verificationService_shouldThrowConflictException_whenVoterAlreadyVoted() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = election(electionId, orgId, ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voter = new VoterListModel();
        voter.setVoterId(voterId);
        voter.setEmail(user.getEmail());
        voter.setElection(election);
        voter.setHasVoted(true);   // 🔥 already voted
        voter.setBlocked(false);

        when(voterRepo.findByElectionIdAndVoterIdAndEmail(electionId, voterId, user.getEmail()))
                .thenReturn(Optional.of(voter));

        when(voterRepo.save(any(VoterListModel.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> verificationService.verfication(voterId, electionId.toString())
        );

        assertEquals("VOTER_NOT_ELIGIBLE", ex.getCode());

        // ✅ save happens (verified set true)
        ArgumentCaptor<VoterListModel> captor = ArgumentCaptor.forClass(VoterListModel.class);
        verify(voterRepo).save(captor.capture());
        assertTrue(captor.getValue().isVerified());

        verify(tokenService, never()).issueToken(anyString(), any(), any());
        verify(auditService, atLeastOnce()).audit(any());
    }

    @Test
    void verificationService_shouldVerify_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String voterId = UUID.randomUUID().toString();
        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);
        var election = election(electionId, orgId, ElectionStatus.running);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));
        var voter = new VoterListModel();
        voter.setVoterId(voterId);
        voter.setEmail(user.getEmail());
        voter.setElection(election);
        voter.setHasVoted(false);
        voter.setBlocked(false);
        when(voterRepo.findByElectionIdAndVoterIdAndEmail(electionId,voterId,user.getEmail())).thenReturn(Optional.of(voter));

        OneTokenModel token = new OneTokenModel();
        token.setTokenId("tok-123");
        token.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(5));

        when(tokenService.issueToken(anyString(), any(ElectionModel.class), any(VoterListModel.class)))
                .thenReturn(token);
        when(voterRepo.save(any(VoterListModel.class))).thenAnswer(inv -> inv.getArgument(0));

        var out  = verificationService.verfication(voterId, electionId.toString());

        // ---- assert ----
        assertNotNull(out);
        assertEquals("tok-123", out.getTokenId());
        assertNotNull(out.getExpiryTime());

        ArgumentCaptor<VoterListModel> captor = ArgumentCaptor.forClass(VoterListModel.class);
        verify(voterRepo).save(captor.capture());
        assertTrue(captor.getValue().isVerified());

        verify(tokenService, times(1)).issueToken(anyString(), any(ElectionModel.class), any(VoterListModel.class));
        verify(auditService, atLeastOnce()).audit(any());


    }

}
