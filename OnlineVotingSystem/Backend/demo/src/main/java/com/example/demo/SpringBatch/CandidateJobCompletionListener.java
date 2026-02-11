package com.example.demo.SpringBatch;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Models.CandidateUploadStaging;
import com.example.demo.Repositories.CandidateListStagingRepo;
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
public class CandidateJobCompletionListener implements JobExecutionListener {

    private static final Logger log = LoggerFactory.getLogger(CandidateJobCompletionListener.class);

    private final CandidateListStagingRepo candidateListStagingRepo;
    private final SafeAuditService safeAuditService;

    @Override
    public void beforeJob(JobExecution jobExecution) {
        // no Loki noise
    }

    @Transactional
    @Override
    public void afterJob(JobExecution jobExecution) {

        JobParameters p = jobExecution.getJobParameters();
        UUID jobId = UUID.fromString(p.getString("jobId"));
        String electionId = p.getString("electionId");
        String importerId = p.getString("importerId");

        BatchStatus status = jobExecution.getStatus();
        String exitCode = jobExecution.getExitStatus() != null ? jobExecution.getExitStatus().getExitCode() : null;

        try {
            if (status == BatchStatus.FAILED) {
                List<CandidateUploadStaging> errors = candidateListStagingRepo.findInvalidRowsByJobId(jobId);

                try {
                    File errorFile = File.createTempFile("candidate_errors_" + jobId + "_", ".csv");
                    try (BufferedWriter writer = new BufferedWriter(new FileWriter(errorFile))) {
                        writer.write("line,error\n");
                        for (CandidateUploadStaging row : errors) {
                            writer.write(String.format("%d,%s\n",
                                    row.getLineNumber() == null ? -1 : row.getLineNumber(),
                                    row.getErrorMessage() == null ? "" : row.getErrorMessage().replace(",", " ")
                            ));
                        }
                    }

                    log.warn("batch job failed",
                            kv("action", "UPLOAD_CANDIDATES"),
                            kv("result", "FAILED"),
                            kv("reason", "BATCH_FAILED"),
                            kv("jobId", jobId.toString()),
                            kv("exitCode", exitCode),
                            kv("errorCount", errors.size())
                    );

                    safeAuditService.audit(AuditLogsRequest.builder()
                            .actor(importerId)
                            .electionId(electionId)
                            .action(AuditActions.UPLOAD_CANDIDATES.name())
                            .status(ActionStatus.FAILED.name())
                            .entityId("UPLOAD")
                            .details("Candidate import FAILED. jobId=" + jobId + ", errors=" + errors.size())
                            .build());

                } catch (IOException e) {
                    log.error("batch job failed - error report write failed",
                            kv("action", "UPLOAD_CANDIDATES"),
                            kv("jobId", jobId.toString()),
                            kv("exitCode", exitCode),
                            e
                    );

                    safeAuditService.audit(AuditLogsRequest.builder()
                            .actor(importerId)
                            .electionId(electionId)
                            .action(AuditActions.UPLOAD_CANDIDATES.name())
                            .status(ActionStatus.FAILED.name())
                            .entityId("UPLOAD")
                            .details("Candidate import FAILED. jobId=" + jobId + " (error report write failed)")
                            .build());
                }

                return;
            }

            if (status == BatchStatus.COMPLETED) {
                safeAuditService.audit(AuditLogsRequest.builder()
                        .actor(importerId)
                        .electionId(electionId)
                        .action(AuditActions.UPLOAD_CANDIDATES.name())
                        .status(ActionStatus.SUCCESS.name())
                        .entityId("UPLOAD")
                        .details("Candidate import COMPLETED. jobId=" + jobId)
                        .build());
            }

        } finally {
            candidateListStagingRepo.deleteAllByJobId(jobId);
        }
    }
}
