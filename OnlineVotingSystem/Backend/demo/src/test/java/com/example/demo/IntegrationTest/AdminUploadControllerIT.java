package com.example.demo.IntegrationTest;

import com.example.demo.DAO.ImportReport;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Enums.Role;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.Service.UserInfoService;
import com.example.demo.TestHelpers.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class AdminUploadControllerIT extends IntegrationTestBase {
    @Autowired
    TestRestTemplate restTemplate;
    @Autowired
    ElectionModelRepository electionModelRepository;
    @Autowired
    UserModelRepository userModelRepository;
    @Autowired
    OrganizationRepository organizationRepository;
    @MockitoBean
    UserInfoService userInfoService;
    @MockitoBean
    JobLauncher jobLauncher;
    @Autowired
    @Qualifier("voterImportJob")
    Job voterImportJob;
    @Autowired
    AuditLogsRepository auditLogsRepository;
    @BeforeEach
    void setup() {
        auditLogsRepository.deleteAll();
        electionModelRepository.deleteAll();
        userModelRepository.deleteAll();
        organizationRepository.deleteAll();
    }
    @Test
    void uploadShouldSuccess_whenHappyPath() throws Exception {
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

        ElectionModel election = new ElectionModel();
        election.setCreatedBy(user);
        election.setStatus(ElectionStatus.draft);
        election.setOrganization(orgModel);
        election.setVoterListUploaded(false);
        election.setCandidateListUploaded(false);
        election.setStartTime(LocalDateTime.now());
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setName("E1");
        election.setElectionType("e");
        election.setMerkleRoot(null);
        electionModelRepository.save(election);

        when(userInfoService.getCurrentUser()).thenReturn(user);
        JobExecution jobExecution = new JobExecution(1L);
        jobExecution.setStatus(BatchStatus.COMPLETED);

        when(jobLauncher.run(eq(voterImportJob),any())).thenReturn(jobExecution);
        ByteArrayResource csvFile = new ByteArrayResource(
                "voterId,email\n1,a@a.com\n".getBytes()
        ) {
            @Override
            public String getFilename() {
                return "voter.csv";
            }
        };
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", csvFile);
        body.add("electionId", election.getId().toString());
        body.add("voterIdColumn", "voterId");
        body.add("emailColumn", "email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String,Object>> request = new HttpEntity<>(body,headers);

        ResponseEntity<ImportReport> response = restTemplate.postForEntity("/admin/election/upload/voters",
                request,
                ImportReport.class);
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo("COMPLETED");
        assertThat(response.getBody().getJobId()).isNotBlank();
        assertThat(response.getBody().getErrorFilePath()).isNotBlank();

    }

    @Test
    void uploadShouldFail_whenElectionNotDraft() throws Exception {
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

        ElectionModel election = new ElectionModel();
        election.setCreatedBy(user);
        election.setStatus(ElectionStatus.running);
        election.setOrganization(orgModel);
        election.setVoterListUploaded(false);
        election.setCandidateListUploaded(false);
        election.setStartTime(LocalDateTime.now());
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setName("E1");
        election.setElectionType("e");
        election.setMerkleRoot(null);
        electionModelRepository.save(election);

        when(userInfoService.getCurrentUser()).thenReturn(user);
        JobExecution jobExecution = new JobExecution(1L);
        jobExecution.setStatus(BatchStatus.COMPLETED);

        when(jobLauncher.run(eq(voterImportJob),any())).thenReturn(jobExecution);
        ByteArrayResource csvFile = new ByteArrayResource(
                "voterId,email\n1,a@a.com\n".getBytes()
        ) {
            @Override
            public String getFilename() {
                return "voter.csv";
            }
        };
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", csvFile);
        body.add("electionId", election.getId().toString());
        body.add("voterIdColumn", "voterId");
        body.add("emailColumn", "email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String,Object>> request = new HttpEntity<>(body,headers);

        ResponseEntity<ImportReport> response = restTemplate.postForEntity("/admin/election/upload/voters",
                request,
                ImportReport.class);
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo("409");
//        assertThat(response.getBody().getErrorFilePath()).isNotBlank();

    }
    @Test
    void uploadShouldFail_whenVoterListAlreadyUploaded() throws Exception {
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

        ElectionModel election = new ElectionModel();
        election.setCreatedBy(user);
        election.setStatus(ElectionStatus.draft);
        election.setOrganization(orgModel);
        election.setVoterListUploaded(true);
        election.setCandidateListUploaded(false);
        election.setStartTime(LocalDateTime.now());
        election.setEndTime(LocalDateTime.now().plusDays(1));
        election.setName("E1");
        election.setElectionType("e");
        election.setMerkleRoot(null);
        electionModelRepository.save(election);

        when(userInfoService.getCurrentUser()).thenReturn(user);
        JobExecution jobExecution = new JobExecution(1L);
        jobExecution.setStatus(BatchStatus.COMPLETED);

        when(jobLauncher.run(eq(voterImportJob),any())).thenReturn(jobExecution);
        ByteArrayResource csvFile = new ByteArrayResource(
                "voterId,email\n1,a@a.com\n".getBytes()
        ) {
            @Override
            public String getFilename() {
                return "voter.csv";
            }
        };
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", csvFile);
        body.add("electionId", election.getId().toString());
        body.add("voterIdColumn", "voterId");
        body.add("emailColumn", "email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String,Object>> request = new HttpEntity<>(body,headers);

        ResponseEntity<ImportReport> response = restTemplate.postForEntity("/admin/election/upload/voters",
                request,
                ImportReport.class);
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo("409");
//        assertThat(response.getBody().getJobId()).isNotBlank();
//        assertThat(response.getBody().getErrorFilePath()).isNotBlank();

    }





}
