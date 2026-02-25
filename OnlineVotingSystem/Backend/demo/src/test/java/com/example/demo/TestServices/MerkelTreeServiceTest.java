package com.example.demo.TestServices;

import com.example.demo.DTO.VerifyReceiptResponse;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.*;
import com.example.demo.Records.ReceiptTokenClaim;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.MerkleLevelModelRepository;
import com.example.demo.Repositories.ReceiptLeafIndexRepository;
import com.example.demo.Service.HashLevelCodec;
import com.example.demo.Service.MerkleTreeService;
import com.example.demo.Service.ReceiptService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MerkelTreeServiceTest {

    @Mock ReceiptService receiptService;
    @Mock ElectionModelRepository electionModelRepository;
    @Mock ReceiptLeafIndexRepository receiptLeafIndexRepository;
    @Mock MerkleLevelModelRepository merkleLevelModelRepository;
    @Mock HashLevelCodec hashLevelCodec;

    @InjectMocks
    MerkleTreeService merkleTreeService;

    private OrganizationModel org(UUID orgId){
        OrganizationModel org = new OrganizationModel();;
        org.setId(orgId);
        return org;
    }
    private UserModel userWithOrg(UUID orgId){
        UserModel user = new UserModel();
        user.setId(UUID.randomUUID());
        user.setEmail("test@test.com");
        user.setOrganization(org(orgId));
        return user;
    }
    private ElectionModel electionWithOrg(UUID orgId, UUID electionId, ElectionStatus status,String merkelRoot){
        ElectionModel election = new ElectionModel();
        election.setId(electionId);
        election.setStatus(status);
        election.setOrganization(org(orgId));
        election.setMerkleRoot(merkelRoot);
        election.setName("Election");
        return election;
    }

    private ReceiptLeafIndexModel receiptLeafIndexModel(int leafIndex){
        ReceiptLeafIndexModel receiptLeafIndex = new ReceiptLeafIndexModel();
        receiptLeafIndex.setLeafIndex(leafIndex);
        receiptLeafIndex.setVotedAt(LocalDateTime.now());
        return receiptLeafIndex;
    }

    private MerkelLevelModel merkelLevelModel (int level,int nodeCount,byte[] hashblob){
        MerkelLevelModel merkelLevel = new MerkelLevelModel();
        merkelLevel.setLevel(level);
        merkelLevel.setHashBlob(hashblob);
        merkelLevel.setNodeCount(nodeCount);
        return merkelLevel;
    }

    @Test
    void verifyReceipt_shouldFailAndThrowNotFoundException_whenElectionNotFound(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String receiptToken = "receiptToken";

        ReceiptTokenClaim claim = mock(ReceiptTokenClaim.class);
        when(claim.electionId()).thenReturn(electionId);

        when(receiptService.verifyAndDecode(receiptToken)).thenReturn(claim);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,()->merkleTreeService.verifyReceipt(receiptToken));
        assertEquals("ELECTION_NOT_FOUND",ex.getCode());

        verify(receiptLeafIndexRepository, never()).findByReceiptKeyHash(any());
        verify(merkleLevelModelRepository, never()).findByElection_IdAndLevel(any(), anyInt());
    }

    @Test
    void verifyReceipt_shouldFailAndThrowConflictException_whenElectionNotPublished(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String receiptToken = "receiptToken";

        ReceiptTokenClaim claim = mock(ReceiptTokenClaim.class);
        when(claim.electionId()).thenReturn(electionId);
        when(receiptService.verifyAndDecode(receiptToken)).thenReturn(claim);

        // Case: published root missing OR status not published
        ElectionModel e = electionWithOrg(electionId, orgId, ElectionStatus.running, null);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(e));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> merkleTreeService.verifyReceipt(receiptToken));

        assertEquals("ELECTION_NOT_PUBLISHED", ex.getCode());

        verify(receiptLeafIndexRepository, never()).findByReceiptKeyHash(any());
    }

    @Test
    void verifyReceipt_shouldFailAndThrowNotFoundException_whenReceiptNotFound(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();
        String receiptToken = "receiptToken";

        ReceiptTokenClaim claim = mock(ReceiptTokenClaim.class);
        when(claim.electionId()).thenReturn(electionId);
        when(receiptService.verifyAndDecode(receiptToken)).thenReturn(claim);

        String fakeRoot = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[32]);
        ElectionModel e = electionWithOrg(electionId,orgId,ElectionStatus.published,fakeRoot);

        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(e));
        byte[] receiptKeyHash = merkleTreeService.leafHashFromReceiptToken(receiptToken);
        when(receiptLeafIndexRepository.findByReceiptKeyHash(eq(receiptKeyHash)))
                .thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,()->merkleTreeService.verifyReceipt(receiptToken));
        assertEquals("RECEIPT_NOT_FOUND",ex.getCode());
        verify(merkleLevelModelRepository, never()).findByElection_IdAndLevel(any(), anyInt());


    }

    @Test
    void verifyReceipt_shouldFailAndThrowNotFoundException_whenMerkleLevelMissing(){
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String token = "receipt-token";

        var claim = mock(ReceiptTokenClaim.class);
        when(claim.electionId()).thenReturn(electionId);
        when(receiptService.verifyAndDecode(token)).thenReturn(claim);

        String root = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[32]);
        var election = electionWithOrg(orgId,electionId,ElectionStatus.published,root);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        byte[] receiptHashKey = merkleTreeService.leafHashFromReceiptToken(token);
        when(receiptLeafIndexRepository.findByReceiptKeyHash(eq(receiptHashKey))).thenReturn(Optional.of(receiptLeafIndexModel(0)));

        when(merkleLevelModelRepository.findByElection_IdAndLevel(electionId, 0))
                .thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,
                () -> merkleTreeService.verifyReceipt(token));

        assertEquals("MERKLE_LEVEL_MISSING", ex.getCode());
    }

    @Test
    void verifyReceipt_shouldVerifyReceipt_whenHappyPath(){

        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        List<String> tokens = List.of("t0", "t1", "t2", "t3");
        MerkleTreeService.BuiltTree built = merkleTreeService.buildMerkleTree(tokens);

        String root = Base64.getUrlEncoder().withoutPadding().encodeToString(built.root());
        String receiptToken = "t2";
        int leafIndex = 2;

        var claim = mock(ReceiptTokenClaim.class);
        when(claim.electionId()).thenReturn(electionId);
        when(receiptService.verifyAndDecode(receiptToken)).thenReturn(claim);
        var election = electionWithOrg(orgId,electionId,ElectionStatus.published,root);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        byte[] receiptHashKey = merkleTreeService.leafHashFromReceiptToken(receiptToken);
        when(receiptLeafIndexRepository.findByReceiptKeyHash(eq(receiptHashKey))).thenReturn(Optional.of(receiptLeafIndexModel(leafIndex)));
        Map<Integer, List<byte[]>> nodesByLevel = new HashMap<>();
        for (MerkleTreeService.Level lvl : built.levels()) {
            nodesByLevel.put(lvl.level(), lvl.nodes());
        }

        // Repo returns MerkelLevelModel for each level
        for (int lvl = 0; lvl < built.levels().size(); lvl++) {
            List<byte[]> nodes = nodesByLevel.get(lvl);
            byte[] blob = new byte[]{(byte) lvl}; // blob[0] encodes level for our codec answer
            MerkelLevelModel model = merkelLevelModel(lvl, nodes.size(), blob);
            when(merkleLevelModelRepository.findByElection_IdAndLevel(electionId, lvl))
                    .thenReturn(Optional.of(model));
        }

        // HashLevelCodec returns the node at the requested index from our nodesByLevel map
        when(hashLevelCodec.getAt(any(byte[].class), anyInt()))
                .thenAnswer(inv -> {
                    byte[] blob = inv.getArgument(0);
                    int idx = inv.getArgument(1);
                    int lvl = blob[0];
                    return nodesByLevel.get(lvl).get(idx);
                });

        VerifyReceiptResponse out = merkleTreeService.verifyReceipt(receiptToken);

        assertNotNull(out);
        assertTrue(out.isIncluded());
        assertEquals(electionId, out.getElectionId());
        assertEquals(orgId, out.getOrganizationId());
        assertEquals(leafIndex, out.getLeafIndex());
        assertEquals(root, out.getMerkleRootB64());
        assertEquals(built.levels().size() - 1, out.getTreeDepth()); // depth = number of proof steps

        // proof should exist and be non-empty for 4 leaves
        assertNotNull(out.getProof());
        assertFalse(out.getProof().isEmpty());

    }
    @Test
    void buildMerkleTree_shouldWorkWithOddLeafCountByDuplicatingLast() {
        // 3 tokens => level0 has 3 leaf hashes, level1 should be 2 nodes (because last duplicated)
        List<String> tokens = List.of("a", "b", "c");

        MerkleTreeService.BuiltTree built = merkleTreeService.buildMerkleTree(tokens);

        assertNotNull(built.root());
        assertTrue(built.levels().size() >= 2);

        MerkleTreeService.Level level0 = built.levels().get(0);
        assertEquals(3, level0.nodes().size());

        MerkleTreeService.Level level1 = built.levels().get(1);
        assertEquals(2, level1.nodes().size()); // (a,b) and (c,c)
    }
}
