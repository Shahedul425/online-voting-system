package com.example.demo.SpringBatch;

import com.example.demo.Models.VoterUploadStaging;
import com.example.demo.Repositories.VoterUploadStagingRepo;
import jakarta.transaction.Transactional;
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
public class JobCompletionNotificationListener implements JobExecutionListener {
    private final VoterUploadStagingRepo voterUploadStagingRepo;
    @Override
    public void beforeJob(JobExecution jobExecution) {}
    @Override
    @Transactional
    public void afterJob(JobExecution jobExecution) {
        JobParameters jobParameters = jobExecution.getJobParameters();
        UUID jobId = UUID.fromString(jobParameters.getString("jobId"));
        if(jobExecution.getStatus()== BatchStatus.FAILED){
            List<VoterUploadStaging> invalid = voterUploadStagingRepo.findInvalidRowsByJobId(jobId);
            try {
                File error = null;
                try {
                    error = File.createTempFile("VoterList errors "+ jobId,".csv");
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
                try(BufferedWriter writer = new BufferedWriter(new FileWriter(error))){
                        writer.write("line,voterId,email,error\n");
                        for(VoterUploadStaging voterUploadStaging:invalid){
                            writer.write(String.format("%d,%s,%s,%s \n",
                                        voterUploadStaging.getLineNumber()==null?-1:voterUploadStaging.getLineNumber(),
                                        voterUploadStaging.getVoterId(),
                                        voterUploadStaging.getEmail(),
                                        voterUploadStaging.getErrorMessage()==null?" ":voterUploadStaging.getErrorMessage().replace(","," ")
                                    ));
                        }
                    System.out.println("Errors written to: "+error.getAbsolutePath());
                } catch (IOException e) {
                    e.printStackTrace();
                }
                voterUploadStagingRepo.deleteAllByJobId(jobId);
                System.out.println("Failed Job And Staging cleared for the job "+jobId);
            }catch (Exception e){
                e.printStackTrace();
            }

        }
        if (jobExecution.getStatus()==BatchStatus.COMPLETED){
            System.out.println("Job and Staging Successfully Completed "+ jobId );
            voterUploadStagingRepo.deleteAllByJobId(jobId);
        }
    }
}
