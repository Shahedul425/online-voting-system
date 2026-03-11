package com.example.demo.IntegrationTest;


import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Enums.Role;
import com.example.demo.Models.*;
import com.example.demo.Repositories.*;
import com.example.demo.Service.HashLevelCodec;
import com.example.demo.Service.MerkleTreeService;
import com.example.demo.Service.ReceiptService;
import com.example.demo.Service.UserInfoService;
import com.example.demo.TestHelpers.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

public class ElectionControllerIT extends IntegrationTestBase {
    @Autowired
    TestRestTemplate restTemplate;
    @Autowired
    ElectionModelRepository electionModelRepository;
    @Autowired
    VoterListModelRepository voterListModelRepository;
    @Autowired
    OrganizationRepository organizationRepository;
    @Autowired
    UserModelRepository userModelRepository;
    @Autowired
    VoteModelRepository voteModelRepository;
    @Autowired
    MerkleLevelModelRepository merkleLevelModelRepository;
    @Autowired
    AuditLogsRepository auditLogsRepository;
    @Autowired
    ReceiptLeafIndexRepository receiptLeafIndexRepository;
    @MockitoBean
    UserInfoService userInfoService;
    @MockitoBean
    MerkleTreeService merkleTreeService;
    @MockitoBean
    ReceiptService receiptService;
    @MockitoBean
    HashLevelCodec hashLevelCodec;


    @BeforeEach
    void setUp() {
        electionModelRepository.deleteAll();
        voterListModelRepository.deleteAll();
        organizationRepository.deleteAll();
        userModelRepository.deleteAll();
        voteModelRepository.deleteAll();
        merkleLevelModelRepository.deleteAll();
        auditLogsRepository.deleteAll();
    }


    @Test
    void electionShouldCreate_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();


        OrganizationModel orgModel = new OrganizationModel();
        orgModel.setType("uni");
        orgModel.setName("lsbu");
        orgModel.setCountry("uk");
        orgModel.setAllowedDomains(List.of("test.com"));
        organizationRepository.save(orgModel);

        UserModel user = new UserModel();
        user.setEmail("creator@test.com");
        user.setKeycloakId("kc-test");   // required
        user.setRole(Role.admin);        // required if enum
        user.setOrganization(orgModel);
        user = userModelRepository.save(user);

        when(userInfoService.getCurrentUser()).thenReturn(user);

        ElectionRequest requestBody = new ElectionRequest();
        requestBody.setName("Election-1");
        requestBody.setDescription("Test election");
        requestBody.setElectionType("GENERAL");
        requestBody.setStartTime(LocalDateTime.now().plusDays(1));
        requestBody.setEndTime(LocalDateTime.now().plusDays(2));

        HttpHeaders http = new HttpHeaders();
        http.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ElectionRequest> request = new HttpEntity<>(requestBody, http);
        ResponseEntity<ElectionModel> response = restTemplate.postForEntity("/admin/election/create", request, ElectionModel.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Election-1");
        assertThat(response.getBody().getDescription()).isEqualTo("Test election");
        assertThat(response.getBody().getElectionType()).isEqualTo("GENERAL");
        assertThat(response.getBody().getStatus()).isEqualTo(ElectionStatus.draft);

        List<ElectionModel> elections = electionModelRepository.findAll();

        ElectionModel saved = elections.get(0);
        assertThat(saved.getName()).isEqualTo("Election-1");
        assertThat(saved.getOrganization().getId()).isEqualTo(orgModel.getId());
        assertThat(saved.getCreatedBy().getId()).isEqualTo(user.getId());
        assertThat(saved.getStatus()).isEqualTo(ElectionStatus.draft);

    }

    @Test
    void electionShouldNotCreate_whenElectionStopTimeIsBeforeStartTime(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();


        OrganizationModel orgModel = new OrganizationModel();
        orgModel.setType("uni");
        orgModel.setName("lsbu");
        orgModel.setCountry("uk");
        orgModel.setAllowedDomains(List.of("test.com"));
        organizationRepository.save(orgModel);

        UserModel user = new UserModel();
        user.setEmail("creator@test.com");
        user.setKeycloakId("kc-test");   // required
        user.setRole(Role.admin);        // required if enum
        user.setOrganization(orgModel);
        user = userModelRepository.save(user);

        when(userInfoService.getCurrentUser()).thenReturn(user);

        ElectionRequest requestBody = new ElectionRequest();
        requestBody.setName("Election-1");
        requestBody.setDescription("Test election");
        requestBody.setElectionType("GENERAL");
        requestBody.setStartTime(LocalDateTime.now().plusDays(2));
        requestBody.setEndTime(LocalDateTime.now().plusDays(1));

        HttpHeaders http = new HttpHeaders();
        http.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ElectionRequest> request = new HttpEntity<>(requestBody, http);
        ResponseEntity<String> response = restTemplate.postForEntity("/admin/election/create", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("INVALID_TIME_WINDOW");
        assertThat(response.getBody()).contains("startTime must be before endTime");
    }

    @Test
    void publishElection_shouldReturn200_whenHappyPath() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Publish test");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.closed);
        election.setStartTime(LocalDateTime.now().minusDays(2));
        election.setEndTime(LocalDateTime.now().minusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        VoteModel vote1 = new VoteModel();
        vote1.setElectionId(election);
        vote1.setReceiptHashToken("token-1");
        vote1.setRequestId("req-1");
        vote1.setCreatedAt(LocalDateTime.now().minusHours(2).truncatedTo(ChronoUnit.MICROS));
        vote1 = voteModelRepository.save(vote1);

        VoteModel vote2 = new VoteModel();
        vote2.setElectionId(election);
        vote2.setReceiptHashToken("token-2");
        vote2.setRequestId("req-2");
        vote2.setCreatedAt(LocalDateTime.now().minusHours(1).truncatedTo(ChronoUnit.MICROS));
        vote2 = voteModelRepository.save(vote2);

        byte[] leaf1 = "leaf-1".getBytes();
        byte[] leaf2 = "leaf-2".getBytes();
        byte[] root = "root-hash".getBytes();

        MerkleTreeService.Level level0 = new MerkleTreeService.Level(0, List.of(leaf1, leaf2));
        MerkleTreeService.Level level1 = new MerkleTreeService.Level(1, List.of(root));
        MerkleTreeService.BuiltTree builtTree =
                new MerkleTreeService.BuiltTree(root, List.of(level0, level1));

        when(merkleTreeService.buildMerkleTree(List.of("token-1", "token-2")))
                .thenReturn(builtTree);

        when(merkleTreeService.leafHashFromReceiptToken("token-1")).thenReturn(leaf1);
        when(merkleTreeService.leafHashFromReceiptToken("token-2")).thenReturn(leaf2);

        when(hashLevelCodec.pack(List.of(leaf1, leaf2))).thenReturn("packed-level-0".getBytes());
        when(hashLevelCodec.pack(List.of(root))).thenReturn("packed-level-1".getBytes());

        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/admin/election/publish/" + election.getId(),
                null,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        ElectionModel savedElection = electionModelRepository.findById(election.getId()).orElseThrow();
        assertThat(savedElection.getStatus()).isEqualTo(ElectionStatus.published);
        assertThat(savedElection.getPublishedAt()).isNotNull();
        assertThat(savedElection.getMerkleRoot()).isEqualTo(
                java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(root)
        );

        List<MerkelLevelModel> savedLevels = merkleLevelModelRepository.findAll();
//        assertThat(savedLevels).hasSize(2);

        MerkelLevelModel savedLevel0 = savedLevels.stream()
                .filter(l -> l.getLevel() == 0)
                .findFirst()
                .orElseThrow();

        MerkelLevelModel savedLevel1 = savedLevels.stream()
                .filter(l -> l.getLevel() == 1)
                .findFirst()
                .orElseThrow();

        assertThat(savedLevel0.getElection().getId()).isEqualTo(election.getId());
        assertThat(savedLevel0.getNodeCount()).isEqualTo(2);

        assertThat(savedLevel1.getElection().getId()).isEqualTo(election.getId());
        assertThat(savedLevel1.getNodeCount()).isEqualTo(1);

        List<ReceiptLeafIndexModel> receiptIndexes = receiptLeafIndexRepository.findAll();
//        assertThat(receiptIndexes).hasSize(2);

        ReceiptLeafIndexModel index1 = receiptIndexes.stream()
                .filter(i -> i.getLeafIndex() == 0)
                .findFirst()
                .orElseThrow();

        ReceiptLeafIndexModel index2 = receiptIndexes.stream()
                .filter(i -> i.getLeafIndex() == 1)
                .findFirst()
                .orElseThrow();

        assertThat(index1.getElection().getId()).isEqualTo(election.getId());
        assertThat(index1.getReceiptKeyHash()).isEqualTo(leaf1);
        assertThat(index1.getVotedAt().truncatedTo(ChronoUnit.MICROS)).isEqualTo(vote1.getCreatedAt());

        assertThat(index2.getElection().getId()).isEqualTo(election.getId());
        assertThat(index2.getReceiptKeyHash()).isEqualTo(leaf2);
        assertThat(index2.getVotedAt().truncatedTo(ChronoUnit.MICROS)).isEqualTo(vote2.getCreatedAt());
    }


    @Test
    void publishElection_shouldReturn409_whenElectionNotClosed() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Publish test");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().minusDays(2));
        election.setEndTime(LocalDateTime.now().minusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        VoteModel vote1 = new VoteModel();
        vote1.setElectionId(election);
        vote1.setReceiptHashToken("token-1");
        vote1.setRequestId("req-1");
        vote1.setCreatedAt(LocalDateTime.now().minusHours(2).truncatedTo(ChronoUnit.MICROS));
        vote1 = voteModelRepository.save(vote1);

        VoteModel vote2 = new VoteModel();
        vote2.setElectionId(election);
        vote2.setReceiptHashToken("token-2");
        vote2.setRequestId("req-2");
        vote2.setCreatedAt(LocalDateTime.now().minusHours(1).truncatedTo(ChronoUnit.MICROS));
        vote2 = voteModelRepository.save(vote2);

        byte[] leaf1 = "leaf-1".getBytes();
        byte[] leaf2 = "leaf-2".getBytes();
        byte[] root = "root-hash".getBytes();

        MerkleTreeService.Level level0 = new MerkleTreeService.Level(0, List.of(leaf1, leaf2));
        MerkleTreeService.Level level1 = new MerkleTreeService.Level(1, List.of(root));
        MerkleTreeService.BuiltTree builtTree =
                new MerkleTreeService.BuiltTree(root, List.of(level0, level1));

        when(merkleTreeService.buildMerkleTree(List.of("token-1", "token-2")))
                .thenReturn(builtTree);

        when(merkleTreeService.leafHashFromReceiptToken("token-1")).thenReturn(leaf1);
        when(merkleTreeService.leafHashFromReceiptToken("token-2")).thenReturn(leaf2);

        when(hashLevelCodec.pack(List.of(leaf1, leaf2))).thenReturn("packed-level-0".getBytes());
        when(hashLevelCodec.pack(List.of(root))).thenReturn("packed-level-1".getBytes());

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/publish/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("ELECTION_NOT_CLOSED");

    }
    @Test
    void publishElection_shouldReturn409_whenElectionAlreadyPublished() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Publish test");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.published);
        election.setStartTime(LocalDateTime.now().minusDays(2));
        election.setEndTime(LocalDateTime.now().minusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        VoteModel vote1 = new VoteModel();
        vote1.setElectionId(election);
        vote1.setReceiptHashToken("token-1");
        vote1.setRequestId("req-1");
        vote1.setCreatedAt(LocalDateTime.now().minusHours(2).truncatedTo(ChronoUnit.MICROS));
        vote1 = voteModelRepository.save(vote1);

        VoteModel vote2 = new VoteModel();
        vote2.setElectionId(election);
        vote2.setReceiptHashToken("token-2");
        vote2.setRequestId("req-2");
        vote2.setCreatedAt(LocalDateTime.now().minusHours(1).truncatedTo(ChronoUnit.MICROS));
        vote2 = voteModelRepository.save(vote2);

        byte[] leaf1 = "leaf-1".getBytes();
        byte[] leaf2 = "leaf-2".getBytes();
        byte[] root = "root-hash".getBytes();

        MerkleTreeService.Level level0 = new MerkleTreeService.Level(0, List.of(leaf1, leaf2));
        MerkleTreeService.Level level1 = new MerkleTreeService.Level(1, List.of(root));
        MerkleTreeService.BuiltTree builtTree =
                new MerkleTreeService.BuiltTree(root, List.of(level0, level1));

        when(merkleTreeService.buildMerkleTree(List.of("token-1", "token-2")))
                .thenReturn(builtTree);

        when(merkleTreeService.leafHashFromReceiptToken("token-1")).thenReturn(leaf1);
        when(merkleTreeService.leafHashFromReceiptToken("token-2")).thenReturn(leaf2);

        when(hashLevelCodec.pack(List.of(leaf1, leaf2))).thenReturn("packed-level-0".getBytes());
        when(hashLevelCodec.pack(List.of(root))).thenReturn("packed-level-1".getBytes());

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/publish/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("ALREADY_PUBLISHED");

    }

    @Test
    void publishElection_shouldReturn409_whenNoVoteFound() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Publish test");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.closed);
        election.setStartTime(LocalDateTime.now().minusDays(2));
        election.setEndTime(LocalDateTime.now().minusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

//        VoteModel vote1 = new VoteModel();
//        vote1.setElectionId(election);
//        vote1.setReceiptHashToken("token-1");
//        vote1.setRequestId("req-1");
//        vote1.setCreatedAt(LocalDateTime.now().minusHours(2).truncatedTo(ChronoUnit.MICROS));
//        vote1 = voteModelRepository.save(vote1);
//
//        VoteModel vote2 = new VoteModel();
//        vote2.setElectionId(election);
//        vote2.setReceiptHashToken("token-2");
//        vote2.setRequestId("req-2");
//        vote2.setCreatedAt(LocalDateTime.now().minusHours(1).truncatedTo(ChronoUnit.MICROS));
//        vote2 = voteModelRepository.save(vote2);

        byte[] leaf1 = "leaf-1".getBytes();
        byte[] leaf2 = "leaf-2".getBytes();
        byte[] root = "root-hash".getBytes();

        MerkleTreeService.Level level0 = new MerkleTreeService.Level(0, List.of(leaf1, leaf2));
        MerkleTreeService.Level level1 = new MerkleTreeService.Level(1, List.of(root));
        MerkleTreeService.BuiltTree builtTree =
                new MerkleTreeService.BuiltTree(root, List.of(level0, level1));

        when(merkleTreeService.buildMerkleTree(List.of("token-1", "token-2")))
                .thenReturn(builtTree);

        when(merkleTreeService.leafHashFromReceiptToken("token-1")).thenReturn(leaf1);
        when(merkleTreeService.leafHashFromReceiptToken("token-2")).thenReturn(leaf2);

        when(hashLevelCodec.pack(List.of(leaf1, leaf2))).thenReturn("packed-level-0".getBytes());
        when(hashLevelCodec.pack(List.of(root))).thenReturn("packed-level-1".getBytes());

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/publish/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("NO_VOTES");

    }

    @Test
    void updateElection_shouldReturn200_whenHappyPath() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Old description");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ElectionUpdateRequest req = new ElectionUpdateRequest();
        req.setName("Updated Election");
        req.setDescription("Updated description");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ElectionUpdateRequest> request = new HttpEntity<>(req, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/update?id=" + election.getId(),
                request,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Election updated");

        ElectionModel updated = electionModelRepository.findById(election.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Updated Election");
        assertThat(updated.getDescription()).isEqualTo("Updated description");
    }
    @Test
    void updateElection_shouldReturn409_whenElectionNotDraft() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ElectionUpdateRequest req = new ElectionUpdateRequest();
        req.setName("Updated Name");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ElectionUpdateRequest> request = new HttpEntity<>(req, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/update?id=" + election.getId(),
                request,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("ELECTION_NOT_DRAFT");
    }

    @Test
    void updateElection_shouldReturn400_whenInvalidTimeWindow() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ElectionUpdateRequest req = new ElectionUpdateRequest();
        req.setStartTime(LocalDateTime.now().plusDays(5));
        req.setEndTime(LocalDateTime.now().plusDays(1));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ElectionUpdateRequest> request = new HttpEntity<>(req, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/update?id=" + election.getId(),
                request,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("INVALID_TIME_WINDOW");
    }

    @Test
    void updateElection_shouldReturn403_whenCrossOrganizationAccess() {
        OrganizationModel org1 = new OrganizationModel();
        org1.setType("uni");
        org1.setName("lsbu");
        org1.setCountry("uk");
        org1.setAllowedDomains(List.of("test.com"));
        org1 = organizationRepository.save(org1);

        OrganizationModel org2 = new OrganizationModel();
        org2.setType("uni");
        org2.setName("ucl");
        org2.setCountry("uk");
        org2.setAllowedDomains(List.of("test1.com"));
        org2 = organizationRepository.save(org2);

        UserModel creator = new UserModel();
        creator.setEmail("creator@test.com");
        creator.setKeycloakId("kc-creator");
        creator.setRole(Role.admin);
        creator.setOrganization(org1);
        creator = userModelRepository.save(creator);

        UserModel currentUser = new UserModel();
        currentUser.setEmail("admin@test1.com");
        currentUser.setKeycloakId("kc-other");
        currentUser.setRole(Role.admin);
        currentUser.setOrganization(org2);
        currentUser = userModelRepository.save(currentUser);

        when(userInfoService.getCurrentUser()).thenReturn(currentUser);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org1);
        election.setCreatedBy(creator);
        election.setName("Election-1");
        election.setDescription("Old description");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ElectionUpdateRequest req = new ElectionUpdateRequest();
        req.setName("Updated Name");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ElectionUpdateRequest> request = new HttpEntity<>(req, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/update?id=" + election.getId(),
                request,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("CROSS_ORG_ACCESS");

        ElectionModel unchanged = electionModelRepository.findById(election.getId()).orElseThrow();
        assertThat(unchanged.getName()).isEqualTo("Election-1");
    }

    @Test
    void startElection_shouldReturn200_whenElectionIsDraft() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/admin/election/start/" + election.getId(),
                null,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        ElectionModel updated = electionModelRepository.findById(election.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ElectionStatus.running);
    }

    @Test
    void startElection_shouldReturn409_whenElectionIsNotDraft() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/start/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("INVALID_ELECTION_STATE");
    }

    @Test
    void startElection_shouldReturn403_whenCrossOrganizationAccess() {
        OrganizationModel org1 = new OrganizationModel();
        org1.setType("uni");
        org1.setName("lsbu");
        org1.setCountry("uk");
        org1.setAllowedDomains(List.of("test.com"));
        org1 = organizationRepository.save(org1);

        OrganizationModel org2 = new OrganizationModel();
        org2.setType("uni");
        org2.setName("ucl");
        org2.setCountry("uk");
        org2.setAllowedDomains(List.of("test1.com"));
        org2 = organizationRepository.save(org2);

        UserModel creator = new UserModel();
        creator.setEmail("creator@test.com");
        creator.setKeycloakId("kc-creator");
        creator.setRole(Role.admin);
        creator.setOrganization(org1);
        creator = userModelRepository.save(creator);

        UserModel currentUser = new UserModel();
        currentUser.setEmail("admin@test1.com");
        currentUser.setKeycloakId("kc-other");
        currentUser.setRole(Role.admin);
        currentUser.setOrganization(org2);
        currentUser = userModelRepository.save(currentUser);

        when(userInfoService.getCurrentUser()).thenReturn(currentUser);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org1);
        election.setCreatedBy(creator);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/start/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("CROSS_ORG_ACCESS");
    }

    @Test
    void stopElection_shouldReturn200_whenElectionIsRunning() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().minusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/admin/election/stop/" + election.getId(),
                null,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        ElectionModel updated = electionModelRepository.findById(election.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ElectionStatus.stopped);
    }

    @Test
    void stopElection_shouldReturn409_whenElectionIsNotRunning() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/stop/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("ELECTION_NOT_RUNNING");
    }

    @Test
    void stopElection_shouldReturn403_whenCrossOrganizationAccess() {
        OrganizationModel org1 = new OrganizationModel();
        org1.setType("uni");
        org1.setName("lsbu");
        org1.setCountry("uk");
        org1.setAllowedDomains(List.of("test.com"));
        org1 = organizationRepository.save(org1);

        OrganizationModel org2 = new OrganizationModel();
        org2.setType("uni");
        org2.setName("ucl");
        org2.setCountry("uk");
        org2.setAllowedDomains(List.of("test1.com"));
        org2 = organizationRepository.save(org2);

        UserModel creator = new UserModel();
        creator.setEmail("creator@test.com");
        creator.setKeycloakId("kc-creator");
        creator.setRole(Role.admin);
        creator.setOrganization(org1);
        creator = userModelRepository.save(creator);

        UserModel currentUser = new UserModel();
        currentUser.setEmail("admin@test1.com");
        currentUser.setKeycloakId("kc-other");
        currentUser.setRole(Role.admin);
        currentUser.setOrganization(org2);
        currentUser = userModelRepository.save(currentUser);

        when(userInfoService.getCurrentUser()).thenReturn(currentUser);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org1);
        election.setCreatedBy(creator);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().minusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/stop/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("CROSS_ORG_ACCESS");
    }

    @Test
    void closeElection_shouldReturn200_whenElectionIsRunning() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().minusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/admin/election/close/" + election.getId(),
                null,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        ElectionModel updated = electionModelRepository.findById(election.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ElectionStatus.closed);
    }

    @Test
    void closeElection_shouldReturn409_whenElectionIsNotRunning() {
        OrganizationModel org = new OrganizationModel();
        org.setType("uni");
        org.setName("lsbu");
        org.setCountry("uk");
        org.setAllowedDomains(List.of("test.com"));
        org = organizationRepository.save(org);

        UserModel admin = new UserModel();
        admin.setEmail("admin@test.com");
        admin.setKeycloakId("kc-admin");
        admin.setRole(Role.admin);
        admin.setOrganization(org);
        admin = userModelRepository.save(admin);

        when(userInfoService.getCurrentUser()).thenReturn(admin);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org);
        election.setCreatedBy(admin);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.draft);
        election.setStartTime(LocalDateTime.now().plusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(2));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/close/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).contains("ELECTION_NOT_RUNNING");
    }

    @Test
    void closeElection_shouldReturn403_whenCrossOrganizationAccess() {
        OrganizationModel org1 = new OrganizationModel();
        org1.setType("uni");
        org1.setName("lsbu");
        org1.setCountry("uk");
        org1.setAllowedDomains(List.of("test.com"));
        org1 = organizationRepository.save(org1);

        OrganizationModel org2 = new OrganizationModel();
        org2.setType("uni");
        org2.setName("ucl");
        org2.setCountry("uk");
        org2.setAllowedDomains(List.of("test1.com"));
        org2 = organizationRepository.save(org2);

        UserModel creator = new UserModel();
        creator.setEmail("creator@test.com");
        creator.setKeycloakId("kc-creator");
        creator.setRole(Role.admin);
        creator.setOrganization(org1);
        creator = userModelRepository.save(creator);

        UserModel currentUser = new UserModel();
        currentUser.setEmail("admin@test1.com");
        currentUser.setKeycloakId("kc-other");
        currentUser.setRole(Role.admin);
        currentUser.setOrganization(org2);
        currentUser = userModelRepository.save(currentUser);

        when(userInfoService.getCurrentUser()).thenReturn(currentUser);

        ElectionModel election = new ElectionModel();
        election.setOrganization(org1);
        election.setCreatedBy(creator);
        election.setName("Election-1");
        election.setDescription("Test election");
        election.setElectionType("GENERAL");
        election.setStatus(ElectionStatus.running);
        election.setStartTime(LocalDateTime.now().minusDays(1));
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setCreatedAt(LocalDateTime.now());
        election = electionModelRepository.save(election);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/admin/election/close/" + election.getId(),
                null,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("CROSS_ORG_ACCESS");
    }
}
