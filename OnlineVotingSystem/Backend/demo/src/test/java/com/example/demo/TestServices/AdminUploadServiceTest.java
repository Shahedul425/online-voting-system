package com.example.demo.TestServices;

import com.example.demo.DAO.ImportReport;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Service.AdminUploadService;
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
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminUploadServiceTest {
    @Mock JobLauncher jobLauncher;
    @Mock Job voterImportJob;
    @Mock Job candidateImportJob;
    @Mock ElectionModelRepository electionModelRepository;
    @Mock UserInfoService userInfoService;
    @Mock SafeAuditService safeAuditService;
    @InjectMocks
    AdminUploadService adminUploadService;

    @BeforeEach
    void setUp(){
        MDC.put("requestId", "mdc-request-id");
    }
    @AfterEach
    void tearUp(){
        MDC.clear();
    }

    private OrganizationModel org(UUID orgId){
        OrganizationModel org = new OrganizationModel();
        org.setId(orgId);
        return org;
    }
    private UserModel userWithOrg(UUID orgId){
        UserModel user = new UserModel();
        user.setId(UUID.randomUUID());
        user.setOrganization(org(orgId));
        user.setEmail("test@test.com");
        return user;
    }
    private ElectionModel electionModel(UUID electionId, UUID orgId, ElectionStatus status){
        ElectionModel election = new ElectionModel();
        election.setId(electionId);
        election.setStatus(status);
        election.setOrganization(org(orgId));
        return election;
    }
    private MockMultipartFile csvFile(String name) {
        return new MockMultipartFile(
                "file",
                name,
                "text/csv",
                "voterId,email\n1,a@a.com\n".getBytes()
        );
    }



    @Test
    public void adminUploadService_shouldFailAndThrowNotFoundException_whenElectionNotFound() throws Exception{
         UUID electionId = UUID.randomUUID();
         UUID orgId = UUID.randomUUID();
         UserModel user = userWithOrg(orgId);
         when(userInfoService.getCurrentUser()).thenReturn(user);

         var election = electionModel(electionId,orgId,ElectionStatus.draft);
         when(electionModelRepository.findById(electionId)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class,()->adminUploadService.importVoterList(csvFile("name"),electionId,"voterId","email"));
        assertEquals("ELECTION_NOT_FOUND",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(jobLauncher, never()).run(any(), any());
        verify(safeAuditService, atLeastOnce()).audit(any());
    }

    @Test
    public void adminUploadService_shouldFailAndThrowForbiddenException_whenOrgDoesNotMatch() throws Exception {
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UserModel user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(electionId,orgId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(electionModel(electionId,UUID.randomUUID(),ElectionStatus.draft)));

        ForbiddenException ex = assertThrows(ForbiddenException.class,()->adminUploadService.importVoterList(csvFile("name"),electionId,"voterId","email"));
        assertEquals("CROSS_ORG_ACCESS",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(jobLauncher,never()).run(any(),any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    public void adminUploadService_shouldFailAndThrowConflictException_whenElectionIsNotInDraft() throws Exception{
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UserModel user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(electionId,orgId,ElectionStatus.running);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        ConflictException ex = assertThrows(ConflictException.class,()->adminUploadService.importVoterList(csvFile("name"),electionId,"voterId","email"));
        assertEquals("ELECTION_NOT_DRAFT",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(jobLauncher,never()).run(any(),any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    public void adminUploadService_shouldFailAndThrowConflictException_whenListIsAlreadyUploaded() throws Exception{
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UserModel user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        ElectionModel electionModel = new ElectionModel();
        electionModel.setOrganization(org(orgId));
        electionModel.setStatus(ElectionStatus.draft);
        electionModel.setVoterListUploaded(true);
        electionModel.setId(electionId);

        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(electionModel));

        ConflictException ex = assertThrows(ConflictException.class,()->adminUploadService.importVoterList(csvFile("name"),electionId,"voterId","email"));
        assertEquals("VOTER_LIST_ALREADY_UPLOADED",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(jobLauncher,never()).run(any(),any());
        verify(safeAuditService,atLeastOnce()).audit(any());
    }

    @Test
    public void adminUploadService_shouldFailAndThrowBadRequestException_whenFileIsEmpty() throws Exception {
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var empty = new MockMultipartFile("file", "voters.csv", "text/csv", new byte[0]);

        var election = electionModel(electionId,orgId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        BadRequestException ex = assertThrows(BadRequestException.class,()->adminUploadService.importVoterList(empty,electionId,"voterId","email"));
        assertEquals("EMPTY_FILE",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(jobLauncher,never()).run(any(),any());
    }

    @Test
    public void adminUploadService_shouldFailAndThrowBadRequestException_whenFileIsNotCSV() throws Exception {
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();

        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var empty = new MockMultipartFile("file", "voters.txt", "text/csv", "voterId,email\n1,a@a.com\n".getBytes());

        var election = electionModel(electionId,orgId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        BadRequestException ex = assertThrows(BadRequestException.class,()->adminUploadService.importVoterList(empty,electionId,"voterId","email"));
        assertEquals("INVALID_FILE_TYPE",ex.getCode());

        verify(electionModelRepository,never()).save(any());
        verify(jobLauncher,never()).run(any(),any());
    }

    @Test
    public void adminUploadService_shouldUploadFile_whenHappyPath() throws Exception {
        UUID electionId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        var user = userWithOrg(orgId);
        when(userInfoService.getCurrentUser()).thenReturn(user);

        var election = electionModel(electionId,orgId,ElectionStatus.draft);
        when(electionModelRepository.findById(electionId)).thenReturn(Optional.of(election));

        JobExecution exec = mock(JobExecution.class);
        when(exec.getStatus()).thenReturn(BatchStatus.STARTED);
        when(jobLauncher.run(eq(voterImportJob),any())).thenReturn(exec);
        ImportReport out = adminUploadService.importVoterList(csvFile("name.csv"),electionId,"voterId","email");

        assertNotNull(out);
        assertEquals("STARTED",out.getStatus());
        assertNotNull(out.getJobId());
        assertNotNull(out.getErrorFilePath());
        ArgumentCaptor<JobParameters> argument = ArgumentCaptor.forClass(JobParameters.class);
        verify(jobLauncher).run(eq(voterImportJob),argument.capture());
        JobParameters params = argument.getValue();
        assertEquals(electionId.toString(), params.getString("electionId"));
        assertEquals("voterId", params.getString("voterIdColumn"));
        assertEquals("email", params.getString("emailColumn"));
        assertNotNull(params.getString("filePath"));

        verify(safeAuditService, atLeastOnce()).audit(any());


    }




//    ________________________CANDIDATELIST TO DO ALMOST SAME_________________________
}
