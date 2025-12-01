package com.example.demo.SpringBatch;

import com.example.demo.DTO.CandidateCsvRequest;
import com.example.demo.Models.CandidateUploadStaging;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
@RequiredArgsConstructor
public class CandidateBatchJobConfig {
    private final PlatformTransactionManager transactionManager;
    private final CandidateBatchProcessor processor;
    private final CandidateWriterBatch writer;
    private final CandidateBatchReader reader;
    private final JobRepository jobRepository;
    private final CandidateJobCompletionListener listener;
    private final CandidateMigrationTasklet migrationTasklet;

    @Bean
    public Step candidateIngestStep(){
        return new
                StepBuilder("CandidateIngestStep",jobRepository)
                .<CandidateCsvRequest, CandidateUploadStaging>chunk(500,transactionManager)
                .reader(reader)
                .writer(writer)
                .processor(processor)
                .build();
    }
    @Bean
    public Step candidateMigrationStep(){
        return new StepBuilder("candidateMigrationStep",jobRepository)
                .tasklet((Tasklet) migrationTasklet,transactionManager)
                .build();
    }
    @Bean
    public Job candidateUploadJob() {
        return new JobBuilder("candidateUploadJob", jobRepository)
                .listener(listener)
                .start(candidateIngestStep())
                .next(candidateMigrationStep())
                .build();
    }

}
