package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.ImportReport;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.*;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AdminUploadService {

    private final JobLauncher jobLauncher;
    private final Job voterImportJob;
    private final Job candidateImportJob;
    private final ElectionModelRepository electionModelRepository;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;

    public AdminUploadService(
            JobLauncher jobLauncher,
            @Qualifier("voterImportJob") Job voterImportJob,
            @Qualifier("candidateImportJob") Job candidateImportJob,
            ElectionModelRepository electionModelRepository,
            UserInfoService userInfoService,
            SafeAuditService safeAuditService
    ) {
        this.jobLauncher = jobLauncher;
        this.voterImportJob = voterImportJob;
        this.candidateImportJob = candidateImportJob;
        this.electionModelRepository = electionModelRepository;
        this.userInfoService = userInfoService;
        this.safeAuditService = safeAuditService;
    }

    public ImportReport importVoterList(
            MultipartFile file,
            UUID electionId,
            String voterIdColumn,
            String emailColumn
    ) throws Exception {

        UserModel actor = userInfoService.getCurrentUser();
        ElectionModel election = electionModelRepository.findById(electionId).orElse(null);

        if (election == null) {
            safeAuditService.audit(failedAudit(actor, null, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_VOTERS, "Voter upload failed: election not found " + electionId));
            throw new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
        }

        // org boundary
        if (!election.getOrganization().getId().equals(actor.getOrganization().getId())) {
            safeAuditService.audit(failedAudit(actor, electionId, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_VOTERS, "Cross-org voter upload attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "You cannot upload to this election");
        }

        if (election.getStatus() != ElectionStatus.draft) {
            safeAuditService.audit(failedAudit(actor, electionId, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_VOTERS, "Election not draft: " + election.getStatus()));
            throw new ConflictException("ELECTION_NOT_DRAFT", "Only draft elections can be imported");
        }

        if (Boolean.TRUE.equals(election.isVoterListUploaded())) {
            safeAuditService.audit(failedAudit(actor, electionId, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_VOTERS, "Voter list already uploaded"));
            throw new ConflictException("VOTER_LIST_ALREADY_UPLOADED", "Voter list already uploaded");
        }

        validateCsvFile(file);

        File temp = File.createTempFile(UUID.randomUUID() + "_voters_", ".csv");
        file.transferTo(temp);

        UUID jobId = UUID.randomUUID();

        JobParameters jobParameters = new JobParametersBuilder()
                .addString("filePath", temp.getAbsolutePath())
                .addString("electionId", electionId.toString())
                .addString("jobId", jobId.toString())
                .addString("voterIdColumn", voterIdColumn)
                .addString("emailColumn", emailColumn)
                .addString("importerId", actor.getId().toString()) // don't trust client param
                .addLong("timestamp", System.currentTimeMillis())
                .toJobParameters();

        JobExecution jobExecution = jobLauncher.run(voterImportJob, jobParameters);

        ImportReport report = new ImportReport();
        report.setStatus(jobExecution.getStatus().toString());
        report.setJobId(jobId.toString());
        report.setErrorFilePath(temp.getAbsolutePath());

        safeAuditService.audit(successAudit(actor, electionId, actor.getOrganization().getId(),
                AuditActions.UPLOAD_VOTERS, "Voter upload job started. jobId=" + jobId + ", file=" + file.getOriginalFilename()));

        return report;
    }

    public ImportReport importCandidateList(
            MultipartFile file,
            UUID electionId
    ) throws Exception {

        UserModel actor = userInfoService.getCurrentUser();
        ElectionModel election = electionModelRepository.findById(electionId).orElse(null);

        if (election == null) {
            safeAuditService.audit(failedAudit(actor, null, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_CANDIDATES, "Candidate upload failed: election not found " + electionId));
            throw new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
        }

        if (!election.getOrganization().getId().equals(actor.getOrganization().getId())) {
            safeAuditService.audit(failedAudit(actor, electionId, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_CANDIDATES, "Cross-org candidate upload attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "You cannot upload to this election");
        }

        if (election.getStatus() != ElectionStatus.draft) {
            safeAuditService.audit(failedAudit(actor, electionId, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_CANDIDATES, "Election not draft: " + election.getStatus()));
            throw new ConflictException("ELECTION_NOT_DRAFT", "Only draft elections can be imported");
        }

        if (Boolean.TRUE.equals(election.isCandidateListUploaded())) {
            safeAuditService.audit(failedAudit(actor, electionId, actor.getOrganization().getId(),
                    AuditActions.UPLOAD_CANDIDATES, "Candidate list already uploaded"));
            throw new ConflictException("CANDIDATE_LIST_ALREADY_UPLOADED", "Candidate list already uploaded");
        }

        validateCsvFile(file);

        File temp = File.createTempFile(UUID.randomUUID() + "_candidates_", ".csv");
        file.transferTo(temp);

        UUID jobId = UUID.randomUUID();

        JobParameters jobParameters = new JobParametersBuilder()
                .addString("filePath", temp.getAbsolutePath())
                .addString("electionId", electionId.toString())
                .addString("jobId", jobId.toString())
                .addString("importerId", actor.getId().toString())
                .addLong("timestamp", System.currentTimeMillis())
                .toJobParameters();

        JobExecution jobExecution = jobLauncher.run(candidateImportJob, jobParameters);

        ImportReport report = new ImportReport();
        report.setStatus(jobExecution.getStatus().toString());
        report.setJobId(jobId.toString());
        report.setErrorFilePath(temp.getAbsolutePath());

        safeAuditService.audit(successAudit(actor, electionId, actor.getOrganization().getId(),
                AuditActions.UPLOAD_CANDIDATES, "Candidate upload job started. jobId=" + jobId + ", file=" + file.getOriginalFilename()));

        return report;
    }

    private void validateCsvFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_FILE", "Upload file cannot be empty");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".csv")) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only .csv files are allowed");
        }
    }

    private AuditLogsRequest successAudit(UserModel actor, UUID electionId, UUID orgId, AuditActions action, String details) {
        return AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(electionId != null ? electionId.toString() : null)
                .organizationId(orgId != null ? orgId.toString() : null)
                .action(action.name())
                .status(ActionStatus.SUCCESS.name())
                .entityId("UPLOAD")
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private AuditLogsRequest failedAudit(UserModel actor, UUID electionId, UUID orgId, AuditActions action, String details) {
        return AuditLogsRequest.builder()
                .actor(actor != null ? actor.getId().toString() : null)
                .electionId(electionId != null ? electionId.toString() : null)
                .organizationId(orgId != null ? orgId.toString() : null)
                .action(action.name())
                .status(ActionStatus.FAILED.name())
                .entityId("UPLOAD")
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
    }
}