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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
public class AdminUploadService {

    private static final Logger log = LoggerFactory.getLogger(AdminUploadService.class);

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
        UUID orgId = actor.getOrganization().getId();

        ElectionModel election = electionModelRepository.findById(electionId).orElse(null);

        if (election == null) {
            log.warn("upload rejected",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("result", "FAILED"),
                    kv("reason", "ELECTION_NOT_FOUND"),
                    kv("electionId", electionId.toString())
            );
            safeAuditService.audit(failedAudit(actor, null, orgId, AuditActions.UPLOAD_VOTERS, "Election not found"));
            throw new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
        }

        if (!election.getOrganization().getId().equals(orgId)) {
            log.warn("upload blocked",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("result", "BLOCKED"),
                    kv("reason", "CROSS_ORG_ACCESS"),
                    kv("electionId", electionId.toString()),
                    kv("orgId", orgId.toString())
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_VOTERS,
                    "Cross-org voter upload attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "You cannot upload to this election");
        }

        if (election.getStatus() != ElectionStatus.draft) {
            log.warn("upload rejected",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("result", "REJECTED"),
                    kv("reason", "ELECTION_NOT_DRAFT"),
                    kv("electionId", electionId.toString()),
                    kv("currentStatus", election.getStatus().name())
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_VOTERS,
                    "Election not draft: " + election.getStatus()));
            throw new ConflictException("ELECTION_NOT_DRAFT", "Only draft elections can be imported");
        }

        if (Boolean.TRUE.equals(election.isVoterListUploaded())) {
            log.warn("upload rejected",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("result", "REJECTED"),
                    kv("reason", "VOTER_LIST_ALREADY_UPLOADED"),
                    kv("electionId", electionId.toString())
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_VOTERS,
                    "Voter list already uploaded"));
            throw new ConflictException("VOTER_LIST_ALREADY_UPLOADED", "Voter list already uploaded");
        }

        validateCsvFile(file, "UPLOAD_VOTERS");

        File temp = File.createTempFile(UUID.randomUUID() + "_voters_", ".csv");
        file.transferTo(temp);

        UUID jobId = UUID.randomUUID();

        JobParameters jobParameters = new JobParametersBuilder()
                .addString("filePath", temp.getAbsolutePath())
                .addString("electionId", electionId.toString())
                .addString("jobId", jobId.toString())
                .addString("voterIdColumn", voterIdColumn)
                .addString("emailColumn", emailColumn)
                .addString("importerId", actor.getId().toString())
                .addLong("timestamp", System.currentTimeMillis())
                .toJobParameters();

        JobExecution jobExecution;
        try {
            jobExecution = jobLauncher.run(voterImportJob, jobParameters);
        } catch (Exception ex) {
            log.error("upload job launch failed",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("result", "ERROR"),
                    kv("reason", "JOB_LAUNCH_FAILED"),
                    kv("jobId", jobId.toString()),
                    kv("electionId", electionId.toString()),
                    kv("exception", ex.getClass().getSimpleName()),
                    ex
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_VOTERS,
                    "Voter upload job launch failed. jobId=" + jobId));
            throw ex;
        }

        ImportReport report = new ImportReport();
        report.setStatus(jobExecution.getStatus().toString());
        report.setJobId(jobId.toString());
        report.setErrorFilePath(temp.getAbsolutePath());

        safeAuditService.audit(successAudit(actor, electionId, orgId, AuditActions.UPLOAD_VOTERS,
                "Voter upload job started. jobId=" + jobId + ", file=" + safeName(file)));

        return report;
    }

    public ImportReport importCandidateList(MultipartFile file, UUID electionId) throws Exception {

        UserModel actor = userInfoService.getCurrentUser();
        UUID orgId = actor.getOrganization().getId();

        ElectionModel election = electionModelRepository.findById(electionId).orElse(null);

        if (election == null) {
            log.warn("upload rejected",
                    kv("action", "UPLOAD_CANDIDATES"),
                    kv("result", "FAILED"),
                    kv("reason", "ELECTION_NOT_FOUND"),
                    kv("electionId", electionId.toString())
            );
            safeAuditService.audit(failedAudit(actor, null, orgId, AuditActions.UPLOAD_CANDIDATES, "Election not found"));
            throw new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
        }

        if (!election.getOrganization().getId().equals(orgId)) {
            log.warn("upload blocked",
                    kv("action", "UPLOAD_CANDIDATES"),
                    kv("result", "BLOCKED"),
                    kv("reason", "CROSS_ORG_ACCESS"),
                    kv("electionId", electionId.toString()),
                    kv("orgId", orgId.toString())
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_CANDIDATES,
                    "Cross-org candidate upload attempt"));
            throw new ForbiddenException("CROSS_ORG_ACCESS", "You cannot upload to this election");
        }

        if (election.getStatus() != ElectionStatus.draft) {
            log.warn("upload rejected",
                    kv("action", "UPLOAD_CANDIDATES"),
                    kv("result", "REJECTED"),
                    kv("reason", "ELECTION_NOT_DRAFT"),
                    kv("electionId", electionId.toString()),
                    kv("currentStatus", election.getStatus().name())
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_CANDIDATES,
                    "Election not draft: " + election.getStatus()));
            throw new ConflictException("ELECTION_NOT_DRAFT", "Only draft elections can be imported");
        }

        if (Boolean.TRUE.equals(election.isCandidateListUploaded())) {
            log.warn("upload rejected",
                    kv("action", "UPLOAD_CANDIDATES"),
                    kv("result", "REJECTED"),
                    kv("reason", "CANDIDATE_LIST_ALREADY_UPLOADED"),
                    kv("electionId", electionId.toString())
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_CANDIDATES,
                    "Candidate list already uploaded"));
            throw new ConflictException("CANDIDATE_LIST_ALREADY_UPLOADED", "Candidate list already uploaded");
        }

        validateCsvFile(file, "UPLOAD_CANDIDATES");

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

        JobExecution jobExecution;
        try {
            jobExecution = jobLauncher.run(candidateImportJob, jobParameters);
        } catch (Exception ex) {
            log.error("upload job launch failed",
                    kv("action", "UPLOAD_CANDIDATES"),
                    kv("result", "ERROR"),
                    kv("reason", "JOB_LAUNCH_FAILED"),
                    kv("jobId", jobId.toString()),
                    kv("electionId", electionId.toString()),
                    kv("exception", ex.getClass().getSimpleName()),
                    ex
            );
            safeAuditService.audit(failedAudit(actor, electionId, orgId, AuditActions.UPLOAD_CANDIDATES,
                    "Candidate upload job launch failed. jobId=" + jobId));
            throw ex;
        }

        ImportReport report = new ImportReport();
        report.setStatus(jobExecution.getStatus().toString());
        report.setJobId(jobId.toString());
        report.setErrorFilePath(temp.getAbsolutePath());

        safeAuditService.audit(successAudit(actor, electionId, orgId, AuditActions.UPLOAD_CANDIDATES,
                "Candidate upload job started. jobId=" + jobId + ", file=" + safeName(file)));

        return report;
    }

    private void validateCsvFile(MultipartFile file, String action) {
        if (file == null || file.isEmpty()) {
            log.warn("upload rejected",
                    kv("action", action),
                    kv("result", "REJECTED"),
                    kv("reason", "EMPTY_FILE")
            );
            throw new BadRequestException("EMPTY_FILE", "Upload file cannot be empty");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".csv")) {
            log.warn("upload rejected",
                    kv("action", action),
                    kv("result", "REJECTED"),
                    kv("reason", "INVALID_FILE_TYPE"),
                    kv("fileName", name)
            );
            throw new BadRequestException("INVALID_FILE_TYPE", "Only .csv files are allowed");
        }
    }

    private String safeName(MultipartFile file) {
        if (file == null) return null;
        String n = file.getOriginalFilename();
        return (n == null || n.isBlank()) ? "unknown" : n;
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
