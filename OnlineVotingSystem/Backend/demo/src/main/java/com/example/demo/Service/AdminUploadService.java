package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.ImportReport;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUploadService {
    private final VoterListModelRepository voterListModelRepository;
    private final ElectionModelRepository electionModelRepository;
    private final JobLauncher jobLauncher;
    private Job VoterImportJob;
    private Job CandidateImportJob;
    private final UserInfoService userInfoService;
    private final SafeAuditService safeAuditService;

    public ImportReport importVoterList(
            MultipartFile file,
            UUID electionId,
            UUID importerId,
            String voterIdColumn,
            String emailColumn
            ) throws IOException, JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {

        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        try {
            if (electionModel == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .entityId("VoterListModel")
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPLOAD_VOTERS.toString())
                                .status(ActionStatus.FAILED.toString())
                                .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                                .electionId(null)
                                .createdAt(LocalDateTime.now())
                                .details("VoterList upload failed due invalid electionId: "+electionId)
                                .build()
                );
                throw new RuntimeException("Election not found");
            }
            if (electionModel.getStatus() != ElectionStatus.draft) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .entityId("VoterListModel")
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPLOAD_VOTERS.toString())
                                .status(ActionStatus.FAILED.toString())
                                .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .createdAt(LocalDateTime.now())
                                .details("VoterList upload failed due invalid election is not in draft rather its in: "+ electionModel.getStatus())
                                .build()
                );
                throw new RuntimeException("Only draft elections can be imported");
            }
            if (electionModel.isVoterListUploaded() == Boolean.TRUE) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .entityId("VoterListModel")
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPLOAD_VOTERS.toString())
                                .status(ActionStatus.FAILED.toString())
                                .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .createdAt(LocalDateTime.now())
                                .details("VoterList upload failed because VoterList is already uploaded: "+electionId)
                                .build()
                );
                throw new RuntimeException("Voter list Already Uploaded");
            }
            File temp = File.createTempFile(UUID.randomUUID().toString() + " VoterList ", ".csv");
            file.transferTo(temp);
            UUID jobId = UUID.randomUUID();
            JobParameters jobParameters = new JobParametersBuilder()
                    .addString("filePath", temp.getAbsolutePath())
                    .addString("electionId", electionId.toString())
                    .addString("jobId", jobId.toString())
                    .addString("voterIdColumn", voterIdColumn)
                    .addString("emailColumn", emailColumn)
                    .addString("importerId", importerId.toString())
                    .addLong("timestamp", System.currentTimeMillis())
                    .toJobParameters();

            JobExecution jobExecution = jobLauncher.run(VoterImportJob, jobParameters);
            ImportReport importReport = new ImportReport();
            importReport.setStatus(jobExecution.getStatus().toString());
            importReport.setJobId(jobId.toString());
            importReport.setErrorFilePath(temp.getAbsolutePath());
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .entityId("VoterListModel")
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPLOAD_VOTERS.toString())
                            .status(ActionStatus.SUCCESS.toString())
                            .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                            .electionId(electionModel.getId().toString())
                            .createdAt(LocalDateTime.now())
                            .details("VoterList uploaded successfully: "+electionId)
                            .build()
            );
            return importReport;

        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .entityId("VoterListModel")
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPLOAD_VOTERS.toString())
                            .status(ActionStatus.FAILED.toString())
                            .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                            .electionId(electionId.toString())
                            .createdAt(LocalDateTime.now())
                            .details("VoterList upload failed due to: "+e.getMessage())
                            .build()
            );
            throw e;
        }
    };
    public ImportReport importCandidateList(
            MultipartFile file,
            UUID electionId,
            UUID importerId
    ) throws IOException, JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        try {
            if (electionModel == null) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .entityId("CandidateListModel")
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPLOAD_CANDIDATES.toString())
                                .status(ActionStatus.FAILED.toString())
                                .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                                .electionId(null)
                                .createdAt(LocalDateTime.now())
                                .details("CandidateList upload failed due invalid electionId: " + electionId)
                                .build()
                );
                throw new RuntimeException("Election not found");
            }
            if (electionModel.getStatus() != ElectionStatus.draft) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .entityId("CandidateListModel")
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPLOAD_CANDIDATES.toString())
                                .status(ActionStatus.FAILED.toString())
                                .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .createdAt(LocalDateTime.now())
                                .details("CandidateList upload failed because election not in draft rather its in: " + electionModel.getStatus())
                                .build()
                );
                throw new RuntimeException("Only draft elections can be imported");
            }
            if (electionModel.isCandidateListUploaded() == Boolean.TRUE) {
                safeAuditService.audit(
                        AuditLogsRequest.builder()
                                .entityId("CandidateListModel")
                                .actor(userInfoService.getCurrentUser().getId().toString())
                                .action(AuditActions.UPLOAD_CANDIDATES.toString())
                                .status(ActionStatus.FAILED.toString())
                                .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                                .electionId(electionModel.getId().toString())
                                .createdAt(LocalDateTime.now())
                                .details("CandidateList upload failed because candidateList is already uploaded: " + electionId)
                                .build()
                );
                throw new RuntimeException("Candidate list Already Uploaded");
            }
            File temp = File.createTempFile(UUID.randomUUID().toString() + " candidateList", "csv");
            file.transferTo(temp);
            UUID jobId = UUID.randomUUID();
            JobParameters jobParameters = new JobParametersBuilder()
                    .addString("filepath", temp.getAbsolutePath())
                    .addString("electionId", electionId.toString())
                    .addString("jobId", jobId.toString())
                    .addString("importerId", importerId.toString())
                    .toJobParameters();
            JobExecution jobExecution = jobLauncher.run(CandidateImportJob, jobParameters);
            ImportReport importReport = new ImportReport();
            importReport.setStatus(jobExecution.getStatus().toString());
            importReport.setJobId(jobId.toString());
            importReport.setErrorFilePath(temp.getAbsolutePath());
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .entityId("CandidateListModel")
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPLOAD_CANDIDATES.toString())
                            .status(ActionStatus.SUCCESS.toString())
                            .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                            .electionId(electionModel.getId().toString())
                            .createdAt(LocalDateTime.now())
                            .details("CandidateList uploaded Successfully: " + electionId)
                            .build()
            );
            return importReport;
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .entityId("CandidateListModel")
                            .actor(userInfoService.getCurrentUser().getId().toString())
                            .action(AuditActions.UPLOAD_CANDIDATES.toString())
                            .status(ActionStatus.FAILED.toString())
                            .organizationId(userInfoService.getCurrentUser().getOrganization().getId().toString())
                            .electionId(String.valueOf(electionId))
                            .createdAt(LocalDateTime.now())
                            .details("CandidateList upload failed due to: "+e.getMessage())
                            .build()
            );
            throw e;
        }


    }
}
