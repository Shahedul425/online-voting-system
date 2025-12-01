package com.example.demo.SpringBatch;

import com.example.demo.DTO.VoterCsvRequest;
import com.example.demo.Models.VoterUploadStaging;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;


@Configuration
@RequiredArgsConstructor

public class VoterBatchJobConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final VoterBatchReader voterBatchReader;
    private final VoterBatchWriter voterBatchWriter;
    private final VoterBatchProcessor voterBatchProcessor;
    private final JobCompletionNotificationListener joblistener;
    private final VoterMigrationTasklet migrationTasklet;

    @Bean
    public Step ingestToStagingStep() {
        return new StepBuilder("ingestToStagingStep",jobRepository)
                .<VoterCsvRequest, VoterUploadStaging>chunk(500,transactionManager)
                .reader(voterBatchReader)
                .processor(voterBatchProcessor)
                .writer(voterBatchWriter)
                .faultTolerant().build();

    }
    @Bean
    public Step migrationStep(){
        return new StepBuilder("migrationStep",jobRepository)
                .tasklet((Tasklet) migrationTasklet,transactionManager)
                .build();
    }
    @Bean
    public Job VoterImportJob(){
        return new JobBuilder("voterImportJob",jobRepository)
                .listener(joblistener)
                .start(ingestToStagingStep())
                .next(migrationStep())
                .build();
    }

}
