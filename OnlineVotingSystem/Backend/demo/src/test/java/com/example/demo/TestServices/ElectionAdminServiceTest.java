package com.example.demo.TestServices;

import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Models.*;
import com.example.demo.Repositories.*;
import com.example.demo.Service.*;
import com.example.demo.ServiceInterface.UserInfoService;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ElectionAdminServiceTest {
    @Mock UserInfoService userInfoService;
    @Mock OrganizationService organizationService; // unchanged
    @Mock ElectionModelRepository electionModelRepository;
    @Mock MerkleTreeService merkleTreeService;
    @Mock VoteModelRepository voteModelRepository;
    @Mock SafeAuditService safeAuditService;
    @Mock CandidateListRepository candidateListRepository;
    @Mock VoterListModelRepository voterListModelRepository;
    @Mock HashLevelCodec hashLevelCodec;
    @Mock MerkleLevelModelRepository merkleLevelModelRepository;
    @Mock ReceiptLeafIndexRepository receiptLeafIndexRepository;

    @InjectMocks
    ElectionAdminService electionAdminService;

    @BeforeEach
    void setUp() {
        MDC.put("requestId", "mdc-request-id");
    }
    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    private OrganizationModel organizationModel(UUID id) {
        OrganizationModel organizationModel = new OrganizationModel();
        organizationModel.setId(id);
        return organizationModel;
    };

    private void stubSaveReturnsSameWithId() {
        when(electionModelRepository.save(any(ElectionModel.class))).thenAnswer(inv -> {
            ElectionModel e = inv.getArgument(0);
            if (e.getId() == null) e.setId(UUID.randomUUID());
            return e;
        });
    }

    private UserModel admin(UUID orgId){

        UserModel userModel = new UserModel();
        userModel.setEmail("abc@gmail.com");
        userModel.setId(UUID.randomUUID());

        OrganizationModel organizationModel = new OrganizationModel();
        organizationModel.setId(orgId);

        userModel.setOrganization(organizationModel);
        return userModel;
    }

    private ElectionRequest electionRequest(String name,String description, String  type,LocalDateTime startDate, LocalDateTime endDate) {
        ElectionRequest electionRequest = new ElectionRequest();
        electionRequest.setStartTime(startDate);
        electionRequest.setEndTime(endDate);
        electionRequest.setName(name);
        electionRequest.setDescription(description);
        electionRequest.setElectionType(type);
        return electionRequest;
    }
    private VoteModel vote(UUID electionId, String receiptToken) {
        VoteModel v = new VoteModel();
        // if your VoteModel stores election differently, remove this line — it’s not required for this test
        // v.setElectionId(electionId);
        v.setReceiptHashToken(receiptToken);
        v.setCreatedAt(LocalDateTime.now());
        return v;
    }

    private ElectionModel electionModel(UUID orgId,UUID electionId,ElectionStatus status){
        ElectionModel electionModel = new ElectionModel();
        electionModel.setStatus(status);
        electionModel.setStartTime(LocalDateTime.now());
        electionModel.setEndTime(LocalDateTime.now().plusMinutes(10));
        electionModel.setOrganization(organizationModel(orgId));
        electionModel.setId(electionId);
        return electionModel;
    }

    private ElectionUpdateRequest electionUpdateRequest(String name){
        ElectionUpdateRequest electionUpdateRequest1 = new ElectionUpdateRequest();
        electionUpdateRequest1.setDescription("description");
        electionUpdateRequest1.setName(name);
        electionUpdateRequest1.setStartTime(LocalDateTime.now());
        electionUpdateRequest1.setEndTime(LocalDateTime.now().plusMinutes(10));
        return electionUpdateRequest1;
    }

    @Test
    void elecetionAdminService_shouldThrowForbiddenException_whenOrganizationDoesNotExist() {
        UUID orgId = UUID.randomUUID();
        var userModel = admin(null);

        var user = new UserModel();
        user.setEmail("abc@gmail.com");
        user.setId(UUID.randomUUID());
        user.setOrganization(null);

        when(userInfoService.getCurrentUser()).thenReturn(user);

        var req = new ElectionRequest();
        req.setDescription("description");
        req.setName("name");
        req.setElectionType("type");
        req.setStartTime(LocalDateTime.now());
        req.setEndTime(LocalDateTime.now().plusMinutes(5));


        ForbiddenException ex = assertThrows(ForbiddenException.class,()-> electionAdminService.createElection(req));
        assertEquals("NO_ORG", ex.getCode());

        verify(electionModelRepository,never()).save(any());
        // verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    void electionAdminService_shouldThrowBadRequestException_whenElectionStartTimeIsBeforeEndTime() {
        UUID orgId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var req = new ElectionRequest();
        req.setDescription("description");
        req.setName("name");
        req.setElectionType("type");
        req.setStartTime(LocalDateTime.now().plusMinutes(10));
        req.setEndTime(LocalDateTime.now().plusMinutes(5));

        BadRequestException ex = assertThrows(BadRequestException.class, ()-> electionAdminService.createElection(req));
        assertEquals("INVALID_TIME_WINDOW", ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    void electionAdminService_shouldCreateElection_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var req = new ElectionRequest();
        req.setDescription("description");
        req.setName("name");
        req.setElectionType("type");
        req.setStartTime(LocalDateTime.now());
        req.setEndTime(LocalDateTime.now().plusMinutes(5));

        stubSaveReturnsSameWithId();
        var out = electionAdminService.createElection(req);
        assertEquals(orgId,out.getOrganization().getId());
        assertEquals("draft",out.getStatus().toString());
        assertEquals(userModel.getEmail(),out.getCreatedBy().getEmail());
        assertEquals(req.getStartTime(),out.getStartTime());
        assertEquals(req.getEndTime(),out.getEndTime());

        verify(electionModelRepository).save(any(ElectionModel.class));
        verify(safeAuditService,atLeastOnce()).audit(any());

    }

    @Test
    void updateElectionAdminService_shouldThrowConflictException_whenElectionNotInDraft(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);

        var election = electionModel(orgId,electionId,ElectionStatus.running);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        var req = electionUpdateRequest("name");

        ConflictException ex = assertThrows(ConflictException.class,()->electionAdminService.updateElection(electionId.toString(),req));
        assertEquals("ELECTION_NOT_DRAFT",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(safeAuditService,atLeastOnce()).audit(any());


    }

    @Test
    void updateElectionAdminService_shouldThrowBadRequestException_whenStartTimeBeforeEndTime(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();

        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
//        var req = electionUpdateRequest("name");
        var req = new ElectionUpdateRequest();
        req.setDescription("description");
        req.setName("name");
        req.setEndTime(LocalDateTime.now().minusMinutes(5));
        req.setStartTime(LocalDateTime.now().plusMinutes(5));

        BadRequestException ex = assertThrows(BadRequestException.class,()->electionAdminService.updateElection(electionId.toString(),req));
        assertEquals("INVALID_TIME_WINDOW", ex.getCode());

        verify(electionModelRepository,never()).save(any());
    }

    @Test
    void updateElectionAdminService_shouldUpdateElection_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        var req = electionUpdateRequest("name");
        stubSaveReturnsSameWithId();
        var out = electionAdminService.updateElection(electionId.toString(),req);

        ArgumentCaptor<ElectionModel> captor = ArgumentCaptor.forClass(ElectionModel.class);
        verify(electionModelRepository).save(captor.capture());   // <-- capture happens here
        ElectionModel saved = captor.getValue();

        assertEquals("name", saved.getName());
        assertEquals(ElectionStatus.draft, saved.getStatus());
        assertEquals("Election updated", out);
        verify(safeAuditService,atLeastOnce()).audit(any());

    }
    @Test
    void adminElectionService_shouldStartElection_WhenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        electionAdminService.startElection(electionId.toString());

        ArgumentCaptor<ElectionModel> captor = ArgumentCaptor.forClass(ElectionModel.class);
        verify(electionModelRepository).save(captor.capture());
        ElectionModel saved = captor.getValue();
        assertEquals(ElectionStatus.running, saved.getStatus());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }
    @Test
    void adminElectionService_shouldNotStartElectionThrowConflictException_whenElectionNotInDraft(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.running);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        ConflictException exception = assertThrows(ConflictException.class,()->electionAdminService.startElection(electionId.toString()));
        assertEquals("INVALID_ELECTION_STATE",exception.getCode());
        verify(electionModelRepository,never()).save(any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }
    @Test
    void adminElectionService_shouldNotStopElectionThrowConflictException_whenElectionNotRunning(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        ConflictException ex = assertThrows(ConflictException.class,()->electionAdminService.stopElection(electionId.toString()));
        assertEquals("ELECTION_NOT_RUNNING",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(safeAuditService,atLeastOnce()).audit(any());

    }
    @Test
    void adminElectionService_shouldStopElection_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.running);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        electionAdminService.stopElection(electionId.toString());
        ArgumentCaptor<ElectionModel> captor = ArgumentCaptor.forClass(ElectionModel.class);
        verify(electionModelRepository).save(captor.capture());
        ElectionModel saved = captor.getValue();
        assertEquals(ElectionStatus.stopped, saved.getStatus());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    void  adminElectionService_shouldNotCloseElectionAndThrowConflictException_whenElectionIsNotRunning(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        ConflictException exception = assertThrows(ConflictException.class,()->electionAdminService.closeElection(electionId.toString()));

        assertEquals("ELECTION_NOT_RUNNING",exception.getCode());
        verify(electionModelRepository,never()).save(any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }
    @Test
    void adminElectionService_shouldCloseElection_WhenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.running);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        electionAdminService.closeElection(electionId.toString());
        ArgumentCaptor<ElectionModel> captor = ArgumentCaptor.forClass(ElectionModel.class);
        verify(electionModelRepository).save(captor.capture());
        assertEquals(ElectionStatus.closed, captor.getValue().getStatus());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }
    @Test
    void adminElectionService_shouldNotPublishElectionAndThrowConflictException_whenElectionIsNotClosed(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.running);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        ConflictException exception = assertThrows(ConflictException.class,()->electionAdminService.publishElectionResult(electionId.toString()));
        assertEquals("ELECTION_NOT_CLOSED",exception.getCode());
        verify(electionModelRepository,never()).save(any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    void adminElectionService_shouldPublishElection_whenHappyPath() {
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();

        // user
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);

        // election must be CLOSED
        var election = electionModel(orgId, electionId, ElectionStatus.closed);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        // IMPORTANT: save must return non-null (service uses the returned entity)
        when(electionModelRepository.save(any(ElectionModel.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(merkleLevelModelRepository.save(any(MerkelLevelModel.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(receiptLeafIndexRepository.save(any(ReceiptLeafIndexModel.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // votes must be NON-empty
        VoteModel v1 = new VoteModel();
        v1.setId(UUID.randomUUID());
        v1.setElectionId(election);
        v1.setReceiptHashToken("token-1");
        v1.setCreatedAt(LocalDateTime.now());

        VoteModel v2 = new VoteModel();
        v2.setId(UUID.randomUUID());
        v2.setElectionId(election);
        v2.setReceiptHashToken("token-2");
        v2.setCreatedAt(LocalDateTime.now());

        when(voteModelRepository.findByElectionOrdered(electionId)).thenReturn(List.of(v1, v2));

        // buildMerkleTree() returns a real BuiltTree (use REAL types from your service)
        byte[] root = new byte[]{1, 2, 3};
        List<byte[]> level0Nodes = List.of(new byte[]{9}, new byte[]{8});
        MerkleTreeService.Level level0 = new MerkleTreeService.Level(0, level0Nodes);
        MerkleTreeService.BuiltTree built = new MerkleTreeService.BuiltTree(root, List.of(level0));

        when(merkleTreeService.buildMerkleTree(anyList())).thenReturn(built);

        // pack() used when writing MerkelLevelModel
        when(hashLevelCodec.pack(anyList())).thenReturn(new byte[]{7, 7});

        // leaf hash used for ReceiptLeafIndexModel
        when(merkleTreeService.leafHashFromReceiptToken(anyString())).thenReturn(new byte[]{5, 5, 5});

        // ---- run ----
        electionAdminService.publishElectionResult(electionId.toString());

        // ---- assert election saved as PUBLISHED ----
        ArgumentCaptor<ElectionModel> captor = ArgumentCaptor.forClass(ElectionModel.class);
        verify(electionModelRepository, atLeastOnce()).save(captor.capture());

        ElectionModel lastSaved = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertEquals(ElectionStatus.published, lastSaved.getStatus());
        assertNotNull(lastSaved.getMerkleRoot());
        assertTrue(lastSaved.getMerkleRoot().length() > 0);
        assertNotNull(lastSaved.getPublishedAt());

        // wrote levels + receipt indexes
        verify(merkleLevelModelRepository, atLeastOnce()).save(any(MerkelLevelModel.class));
        verify(receiptLeafIndexRepository, atLeastOnce()).save(any(ReceiptLeafIndexModel.class));

        // audit
        verify(safeAuditService, atLeastOnce()).audit(any());
    }
    //    @Test
//    void adminElectionService_shouldNotPublishElectionAndThrowConflictException_whenItIsAlreadyPublished(){
//        UUID orgId = UUID.randomUUID();
//        UUID electionId = UUID.randomUUID();
//        var userModel = admin(orgId);
//        when(userInfoService.getCurrentUser()).thenReturn(userModel);
//        var election = electionModel(orgId,electionId,ElectionStatus.published);
//        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
//        ConflictException exception = assertThrows(ConflictException.class,()->electionAdminService.publishElectionResult(electionId.toString()));
//        assertEquals("ALREADY_PUBLISHED",exception.getCode());
//        verify(electionModelRepository,never()).save(any());
//        verify(safeAuditService,atLeastOnce()).audit(any());
//
//    }
    @Test
    void adminElectionService_shouldNotPublishElectionAndThrowConflictException_whenElectionVoteIsEmpty(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        var userModel = admin(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(userModel);
        var election = electionModel(orgId,electionId,ElectionStatus.closed);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));
        when(voteModelRepository.findByElectionOrdered(electionId)).thenReturn(List.of());
        ConflictException exception = assertThrows(ConflictException.class,()->electionAdminService.publishElectionResult(electionId.toString()));
        assertEquals("NO_VOTES",exception.getCode());
        verify(electionModelRepository,never()).save(any());
    }
}