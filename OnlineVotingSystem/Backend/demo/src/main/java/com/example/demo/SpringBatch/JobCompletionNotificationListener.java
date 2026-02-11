package com.example.demo.SpringBatch;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Models.VoterUploadStaging;
import com.example.demo.Repositories.VoterUploadStagingRepo;
import com.example.demo.Service.SafeAuditService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.List;
import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Component
@RequiredArgsConstructor
public class JobCompletionNotificationListener implements JobExecutionListener {

    private static final Logger log = LoggerFactory.getLogger(JobCompletionNotificationListener.class);

    private final VoterUploadStagingRepo voterUploadStagingRepo;
    private final SafeAuditService safeAuditService;

    @Override
    public void beforeJob(JobExecution jobExecution) {
        JobParameters p = jobExecution.getJobParameters();
        String jobId = p.getString("jobId");
        log.info("Batch job start {} {} {}",
                kv("action", "UPLOAD_VOTERS"),
                kv("phase", "JOB_START"),
                kv("jobId", jobId != null ? jobId : jobExecution.getJobId())
        );
    }

    @Override
    @Transactional
    public void afterJob(JobExecution jobExecution) {
        JobParameters p = jobExecution.getJobParameters();

        UUID jobId = UUID.fromString(p.getString("jobId"));
        String electionId = p.getString("electionId");
        String importerId = p.getString("importerId");

        BatchStatus status = jobExecution.getStatus();
        String exitCode = jobExecution.getExitStatus() != null ? jobExecution.getExitStatus().getExitCode() : null;

        if (status == BatchStatus.FAILED) {
            List<VoterUploadStaging> invalid = voterUploadStagingRepo.findInvalidRowsByJobId(jobId);

            File errorFile = null;
            try {
                errorFile = File.createTempFile("voter_errors_" + jobId + "_", ".csv");

                try (BufferedWriter writer = new BufferedWriter(new FileWriter(errorFile))) {
                    writer.write("line,voterId,email,error\n");
                    for (VoterUploadStaging row : invalid) {
                        writer.write(String.format("%d,%s,%s,%s\n",
                                row.getLineNumber() == null ? -1 : row.getLineNumber(),
                                safe(row.getVoterId()),
                                safe(row.getEmail()),
                                safe(row.getErrorMessage()).replace(",", " ")
                        ));
                    }
                }

                log.warn("Batch job failed - error report generated {} {} {} {} {}",
                        kv("action", "UPLOAD_VOTERS"),
                        kv("phase", "JOB_FAILED"),
                        kv("jobId", jobId.toString()),
                        kv("exitCode", exitCode),
                        kv("errorCount", invalid.size())
                );
                log.info("Batch error report path {} {}",
                        kv("jobId", jobId.toString()),
                        kv("errorFilePath", errorFile.getAbsolutePath())
                );

                safeAuditService.audit(AuditLogsRequest.builder()
                        .actor(importerId)
                        .electionId(electionId)
                        .action(AuditActions.UPLOAD_VOTERS.name())
                        .status(ActionStatus.FAILED.name())
                        .entityId("UPLOAD")
                        .details("Voter import FAILED. jobId=" + jobId + ", errors=" + invalid.size())
                        .build());

            } catch (IOException e) {
                log.error("Batch job failed - could not write error report {} {}",
                        kv("action", "UPLOAD_VOTERS"),
                        kv("jobId", jobId.toString()),
                        e
                );

                safeAuditService.audit(AuditLogsRequest.builder()
                        .actor(importerId)
                        .electionId(electionId)
                        .action(AuditActions.UPLOAD_VOTERS.name())
                        .status(ActionStatus.FAILED.name())
                        .entityId("UPLOAD")
                        .details("Voter import FAILED. jobId=" + jobId + " (error report write failed)")
                        .build());
            } finally {
                voterUploadStagingRepo.deleteAllByJobId(jobId);
                log.info("Batch staging cleared {} {}",
                        kv("action", "UPLOAD_VOTERS"),
                        kv("jobId", jobId.toString())
                );
            }
            return;
        }

        if (status == BatchStatus.COMPLETED) {
            log.info("Batch job completed {} {} {}",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("phase", "JOB_COMPLETED"),
                    kv("jobId", jobId.toString())
            );

            safeAuditService.audit(AuditLogsRequest.builder()
                    .actor(importerId)
                    .electionId(electionId)
                    .action(AuditActions.UPLOAD_VOTERS.name())
                    .status(ActionStatus.SUCCESS.name())
                    .entityId("UPLOAD")
                    .details("Voter import COMPLETED. jobId=" + jobId)
                    .build());

            voterUploadStagingRepo.deleteAllByJobId(jobId);
            log.info("Batch staging cleared {} {}",
                    kv("action", "UPLOAD_VOTERS"),
                    kv("jobId", jobId.toString())
            );
        }
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }
}
