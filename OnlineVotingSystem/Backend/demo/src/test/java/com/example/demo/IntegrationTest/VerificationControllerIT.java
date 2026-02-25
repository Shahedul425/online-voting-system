package com.example.demo.IntegrationTest;

import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Enums.Role;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.Service.UserInfoService;
import com.example.demo.TestHelpers.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class VerificationControllerIT extends IntegrationTestBase {
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
    @MockitoBean
    UserInfoService userInfoService;

    @Test
    void verifyShouldReturnToken_whenHappyPath(){
        UUID orgId = UUID.randomUUID();
        UUID electionId = UUID.randomUUID();


        OrganizationModel orgModel = new OrganizationModel();
        orgModel.setType("uni");
        orgModel.setName("lsbu");
        orgModel.setCountry("uk");
        orgModel.setAllowedDomains(List.of("test.com"));
        organizationRepository.save(orgModel);

        UserModel creator = new UserModel();
        creator.setEmail("creator@test.com");
        creator.setKeycloakId("kc-test");   // required
        creator.setRole(Role.voter);        // required if enum
        creator.setOrganization(orgModel);
        creator = userModelRepository.save(creator);

        UserModel user = new UserModel();
        user.setId(UUID.randomUUID());
        user.setEmail("test@test.com");
        user.setOrganization(orgModel);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        ElectionModel electionModel = new ElectionModel();
        electionModel.setOrganization(orgModel);
        electionModel.setStartTime(LocalDateTime.now());
        electionModel.setStatus(ElectionStatus.running);
        electionModel.setName("Election-1");
        electionModel.setEndTime(LocalDateTime.now().plusDays(1));
        electionModel.setCreatedBy(creator);
        electionModelRepository.save(electionModel);

        VoterListModel voterListModel = new VoterListModel();
        voterListModel.setVoterId("123");
        voterListModel.setEmail("test@test.com");
        voterListModel.setElection(electionModel);
        voterListModel.setBlocked(false);
        voterListModel.setHasVoted(false);
        voterListModelRepository.save(voterListModel);

        String url = "/voter/verification/verify?voterId=123&electionId=" + electionModel.getId();
        ResponseEntity<String> response =
                restTemplate.postForEntity(url, null, String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("tokenId"));
        assertTrue(response.getBody().contains("expiryTime"));

    }
}
