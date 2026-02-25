package com.example.demo.TestServices;

import com.example.demo.DAO.VoteRequest;
import com.example.demo.DAO.VoteSelectionRequest;
import com.example.demo.DTO.VoteReceiptResponse;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.*;
import com.example.demo.Repositories.*;
import com.example.demo.Service.OneTimeTokenService;
import com.example.demo.Service.ReceiptService;
import com.example.demo.Service.SafeAuditService;
import com.example.demo.Service.VoteCommitService;
import com.example.demo.ServiceInterface.UserInfoService;
//import lombok.var;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VoteCommitServiceTest {
    @Mock
    OneTimeTokenService tokenService;
    @Mock
    OneTimeTokenModelRepository tokenRepo;
    @Mock
    ElectionModelRepository electionRepo;
    @Mock
    VoteModelRepository voteRepo;
    @Mock
    CandidateListRepository candidateRepo;
    @Mock
    VoterListModelRepository voterRepo;
    @Mock
    VoteSelectionRepository voteSelectionRepository;
    @Mock
    UserInfoService userInfoService;
    @Mock
    SafeAuditService safeAuditService;
    @Mock
    ReceiptService receiptService;

    @InjectMocks
    VoteCommitService voteCommitService;


    @BeforeEach
    void setUp() {
        MDC.put("requestId", "mdc-req-1");
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    private UserModel userWithOrg(UUID orgId, String email) {
        var org = new OrganizationModel();
        org.setId(orgId);

        var u = new UserModel();
        u.setEmail(email);
        u.setId(UUID.randomUUID());
        u.setOrganization(org);
        return u;
    }

    private ElectionModel electionModel(UUID orgId, String status, UUID electionId) {
        var org = new OrganizationModel();
        org.setId(orgId);
        var election = new ElectionModel();
        election.setId(electionId);
        election.setOrganization(org);
        election.setStatus(ElectionStatus.valueOf(status));
        return election;
    }

    private OneTokenModel oneTokenModel(ElectionModel election, VoterListModel voter, boolean isConsumed, LocalDateTime expiresAt) {
        var oneToken = new OneTokenModel();
        oneToken.setElection(election);
        oneToken.setVoter(voter);
        oneToken.setConsumed(isConsumed);
        oneToken.setExpiresAt(expiresAt);
        return oneToken;
    }

    private VoteSelectionRequest mockVoteSelection(String position, UUID candidateId) {
        var s = new VoteSelectionRequest();
        s.setPosition(position);
        s.setCandidateId(candidateId);
        return s;
    }

    //  _______________________ELECTION RELATED_______________________
    @Test
    void commitVote_WhenElectionNotFound_ShouldThrowException() {
        UUID electionId = UUID.randomUUID();
//        UUID candidateId = UUID.randomUUID();
        UserModel userModel = new UserModel();
        userModel.setId(UUID.randomUUID());
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        VoteRequest voteRequest = new VoteRequest();
        voteRequest.setElectionId(electionId);
        voteRequest.setTokenId("tok-1234567890");
        voteRequest.setRequestId("request-1234567890");

        VoteSelectionRequest sel = new VoteSelectionRequest();
        sel.setPosition("President");
        sel.setCandidateId(UUID.randomUUID());
        voteRequest.setVotes(List.of(sel));

        when(voteRepo.findByRequestId(voteRequest.getRequestId())).thenReturn(Optional.empty());
        when(electionRepo.findById(electionId)).thenReturn(Optional.empty());
        NotFoundException ex = assertThrows(NotFoundException.class, () -> voteCommitService.commitVote(voteRequest));

        verify(voteRepo, never()).save(any());
        verify(tokenRepo, never()).findByTokenId(any());

    }

    @Test
    void commitVote_electionOrganizationNotFound_ShouldThrowForbiddenException() {
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();

        var userModel = userWithOrg(orgId, "admin@example.com");
        when(userInfoService.getCurrentUser()).thenReturn(userModel);

        var election = electionModel(UUID.randomUUID(), String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteRequest = new VoteRequest();
        voteRequest.setElectionId(electionId);
        voteRequest.setTokenId("tok-1234567890");
        voteRequest.setRequestId("request-1234567890");
        VoteSelectionRequest sel = new VoteSelectionRequest();
        sel.setPosition("President");
        sel.setCandidateId(UUID.randomUUID());
        voteRequest.setVotes(List.of(sel));
        when(voteRepo.findByRequestId(voteRequest.getRequestId())).thenReturn(Optional.empty());

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> voteCommitService.commitVote(voteRequest));
        assertEquals("CROSS_ORG_ACCESS", ex.getCode());
        verify(voteRepo, never()).save(any());
        verify(voterRepo, never()).save(any());

    }

    @Test
    void commitVote_electionStatusNotRunning_shouldNotSaveVote_andThrowsConflictException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.draft), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        VoteRequest voteRequest = new VoteRequest();
        voteRequest.setElectionId(electionId);
        voteRequest.setTokenId("token-1234567890");
        voteRequest.setRequestId("req-1234567890");
        voteRequest.setVotes(List.of(mockVoteSelection("President", candidateId)));
        when(voteRepo.findByRequestId(voteRequest.getRequestId())).thenReturn(Optional.empty());

        ConflictException ex = assertThrows(ConflictException.class, () -> voteCommitService.commitVote(voteRequest));
        assertEquals("ELECTION_NOT_RUNNING", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenRepo, never()).save(any());
        verify(voterRepo, never()).save(any());
    }

    //  _________________________USER RELATED___________________________________
    @Test
    void commitVote_whenRequestIdAlreadyExists_ShouldReturnExistingReceiptToken_AndDoesnotSaveAnyNewVote() {
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var voteRequest = new VoteRequest();
        voteRequest.setElectionId(electionId);
        voteRequest.setTokenId("tok-1234567890");
        voteRequest.setRequestId("request-1234567890");
        voteRequest.setVotes(List.of());

        var existingElection = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        var existingVote = new VoteModel();
//        existingVote.setId(UUID.randomUUID());
        existingVote.setElectionId(existingElection);
        existingVote.setReceiptHashToken("receipt-hash-token");
        existingVote.setCreatedAt(LocalDateTime.now());
        when(voteRepo.findByRequestId(voteRequest.getRequestId())).thenReturn(Optional.of(existingVote));

        VoteReceiptResponse out = voteCommitService.commitVote(voteRequest);

        assertEquals(electionId, out.getElectionId());
        assertEquals("receipt-hash-token", out.getReceiptToken());

        verify(voteRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(any());
        verify(voterRepo, never()).save(any());
        verify(safeAuditService, atLeastOnce()).audit(any());

    }

    @Test
    void commitVote_userAlreadyVoted_shouldNotSaveVote_andReturnsConflictException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

//        var cand = new CandidateListModel();
//        cand.setId(candidateId);
//        cand.setElectionId(election);
//        cand.setPosition("President");
//        when(candidateRepo.findById(candidateId)).thenReturn(Optional.of(cand));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("President", candidateId)));

        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(true);
        voter.setEmail("abc@gmail.com");

        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        ConflictException ex = assertThrows(ConflictException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("ALREADY_VOTED", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString()); // optional but great
        verify(safeAuditService, atLeastOnce()).audit(any());
    }


    @Test
    void commitVote_emailFromTokenAndSecurityContexDoesNotMatch_shouldNotSaveAndThrowForbiddenException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("request-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("President", candidateId)));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(true);
        voter.setEmail("abcd@gmail.com");
        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("TOKEN_NOT_FOR_USER", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());
    }

    //  ___________________________HAPPY_____________________________
    @Test
    void commitVote_happyPath_savesVoteSelections_consumesToken_marksVoterVoted_returnsReceipt() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId1 = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);
        var org = new OrganizationModel();
        org.setId(orgId);

        var candidateId = new CandidateListModel();
        candidateId.setId(candidateId1);

        var voteSelection = new VoteSelectionRequest();
        voteSelection.setCandidateId(candidateId1);


        var votes = mockVoteSelection("President", candidateId1);
        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);

        voteReq.setVotes(List.of(votes));

        var election = new ElectionModel();
        election.setStatus(ElectionStatus.running);
        election.setOrganization(org);
        election.setId(electionId);

        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
//        voter.setVerified(true);
        voter.setEmail("abc@gmail.com");
        var candidate = new CandidateListModel();
        candidate.setElectionId(election);
        candidate.setId(UUID.randomUUID());
        candidate.setPosition("President");

        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId("token-1234567890")).thenReturn(Optional.of(token));

        when(candidateRepo.findById(candidateId1)).thenReturn(Optional.of(candidate));
        when(receiptService.generateReceiptHash(any(UUID.class), anyString()))
                .thenReturn("receipt-123");

        VoteReceiptResponse out = voteCommitService.commitVote(voteReq);

        assertEquals("receipt-123", out.getReceiptToken());
        assertEquals(electionId, out.getElectionId());
        assertNotNull(out.getCreatedAt());


        verify(voteRepo).save(any(VoteModel.class));
        verify(tokenService).consumeByTokenId("token-1234567890");
        verify(safeAuditService, atLeastOnce()).audit(any());
        verify(voterRepo).save(argThat(v -> v.isHasVoted() && v.getVotedAt() != null));
        verify(voteSelectionRepository).save(any(VoteSelectionModel.class));

    }


//  ____________________TOKEN RELATED_________________________

    @Test
    void commitVote_tokenExpired_shouldNotSaveVote_andReturnsConflictException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);
        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));
        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("President", candidateId)));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());
        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");
        var token = oneTokenModel(election, voter, false, LocalDateTime.now().minusMinutes(1));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));
        ConflictException ex = assertThrows(ConflictException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("TOKEN_EXPIRED", ex.getCode());
        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());
        verify(safeAuditService, atLeastOnce()).audit(any());


    }

    @Test
    void tokenConsumed_shouldNotSaveVote_andReturnsConflictException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("President", candidateId)));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");
        var token = oneTokenModel(election, voter, true, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        ConflictException ex = assertThrows(ConflictException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("TOKEN_ALREADY_USED", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());

    }

    @Test
    void commitVote_electionNotFoundInTkn_shouldNotSaveVote_andReturnsForbiddenException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("President", candidateId)));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");

        var differentElection = electionModel(orgId, String.valueOf(ElectionStatus.running), UUID.randomUUID());

        var token = oneTokenModel(differentElection, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("TOKEN_WRONG_ELECTION", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());
    }

    @Test
    void commitVote_tokenNotFound_shouldNotSaveVote_andReturnsNotFoundException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("President", candidateId)));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("TOKEN_NOT_FOUND", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());

    }

//  _________________CANDIDATE RELATE___________________________

    @Test
    void commitVote_emptyCandidate_shouldNotSaveVote_andReturnsBadRequestException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of());
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");

        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("EMPTY_VOTES", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());


    }

    @Test
    void commitVote_candidatePositionEmpty_shouldNotSaveVote_andReturnsBadRequestException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(mockVoteSelection("", candidateId)));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");
        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("POSITION_REQUIRED", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());

    }

    @Test
    void commitVote_candidateDuplicatePosition_shouldThrowBadRequestException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        UUID c1 = UUID.randomUUID();
        UUID c2 = UUID.randomUUID();

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(
                mockVoteSelection("President", c1),
                mockVoteSelection("President", c2) // duplicate position
        ));

        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");

        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        // ✅ Stub ONLY the first candidate (because service will lookup c1 before detecting duplicate)
        var cand1 = new CandidateListModel();
        cand1.setId(c1);
        cand1.setElectionId(election);
        cand1.setPosition("President");
        when(candidateRepo.findById(c1)).thenReturn(Optional.of(cand1));

        BadRequestException ex =
                assertThrows(BadRequestException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("DUPLICATE_POSITION", ex.getCode());

        verify(candidateRepo, times(1)).findById(c1);
        verify(candidateRepo, never()).findById(c2);

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());

        // your service does NOT audit for duplicate-position branch
        verify(safeAuditService, never()).audit(any());
    }

    @Test
    void commitVote_candidateNotFound_shouldThrowNotFoundException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(
                mockVoteSelection("President",candidateId)
        ));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());
        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");
        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));


        when(candidateRepo.findById(candidateId)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("CANDIDATE_NOT_FOUND", ex.getCode());

        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());
    }

    @Test
    void commitVote_candidateNotInElection_shouldThrowConflictException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(
                mockVoteSelection("President",candidateId)
        ));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());
        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");
        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        var anotherElection = electionModel(orgId, String.valueOf(ElectionStatus.running),UUID.randomUUID());
        var candidate = new CandidateListModel();
        candidate.setId(candidateId);
        candidate.setElectionId(anotherElection);
        candidate.setPosition("President");

        when(candidateRepo.findById(candidateId)).thenReturn(Optional.of(candidate));

        ConflictException ex = assertThrows(ConflictException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("CANDIDATE_NOT_IN_ELECTION", ex.getCode());
        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());
    }

    @Test
    void commitVote_candidatePositionMismatch_shouldThrowBadRequestException() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        var user = userWithOrg(orgId, "abc@gmail.com");
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(orgId, String.valueOf(ElectionStatus.running), electionId);
        when(electionRepo.findById(electionId)).thenReturn(Optional.of(election));

        var voteReq = new VoteRequest();
        voteReq.setTokenId("token-1234567890");
        voteReq.setRequestId("req-1234567890");
        voteReq.setElectionId(electionId);
        voteReq.setVotes(List.of(
                mockVoteSelection("President",candidateId)
        ));
        when(voteRepo.findByRequestId(voteReq.getRequestId())).thenReturn(Optional.empty());

        var voter = new VoterListModel();
        voter.setBlocked(false);
        voter.setHasVoted(false);
        voter.setEmail("abc@gmail.com");
        var token = oneTokenModel(election, voter, false, LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByTokenId(voteReq.getTokenId())).thenReturn(Optional.of(token));

        var candidate = new CandidateListModel();
        candidate.setId(candidateId);
        candidate.setElectionId(election);
        candidate.setPosition("President1");
        when(candidateRepo.findById(candidateId)).thenReturn(Optional.of(candidate));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> voteCommitService.commitVote(voteReq));
        assertEquals("POSITION_MISMATCH", ex.getCode());
        verify(voteRepo, never()).save(any());
        verify(voteSelectionRepository, never()).save(any());
        verify(voterRepo, never()).save(any());
        verify(tokenService, never()).consumeByTokenId(anyString());
        verify(receiptService, never()).generateReceiptHash(any(), anyString());

    }
}