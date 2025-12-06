package com.example.demo.SpringBatch;

import com.example.demo.Models.CandidateUploadStaging;
import com.example.demo.Repositories.CandidateListRepository;
import com.example.demo.Repositories.CandidateListStagingRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobExecutionListener;
import org.springframework.batch.core.JobParameters;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CandidateJobCompletionListener implements JobExecutionListener {
    private final CandidateListStagingRepo  candidateListStagingRepo;
    @Override
    public void beforeJob(JobExecution jobExecution) {}

    @Override
    public void afterJob(JobExecution jobExecution) {
        JobParameters jobParameters = jobExecution.getJobParameters();
        UUID jobId = UUID.fromString(jobParameters.getString("jobId"));
        if(jobExecution.getStatus()== BatchStatus.FAILED){
            List<CandidateUploadStaging> errors = candidateListStagingRepo.findInvalidRowsByJobId(jobId);

            try {
                File error = null;
                error = File.createTempFile("CandidateList erros " + jobId, "csv" );
                try (BufferedWriter writer = new BufferedWriter(new FileWriter(error))){
                    writer.write("line,error\n");
                    for (CandidateUploadStaging candidateUploadStaging:errors){
                        writer.write(String.format("%d,%s \n",
                                candidateUploadStaging.getLineNumber()==null?-1:candidateUploadStaging.getLineNumber(),
                                candidateUploadStaging.getErrorMessage()==null?"":candidateUploadStaging.getErrorMessage()
                                ));
                    }
                    System.out.println("Errors written to: "+error.getAbsolutePath());
                }catch (IOException e){
                    e.printStackTrace();
                }
                candidateListStagingRepo.deleteAllByJobId(jobId);
                System.out.println("Failed to write to file: "+error.getAbsolutePath());

            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        if(jobExecution.getStatus()== BatchStatus.COMPLETED){
            System.out.println("Job completed!");
            candidateListStagingRepo.deleteAllByJobId(jobId);
        }
    }
}
