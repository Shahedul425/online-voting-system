package com.example.demo.TestHelpers;

import org.mockito.Mockito;
import org.springframework.batch.core.Job;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class BatchJobTestConfig {

    @Bean(name = "voterImportJob")
    Job voterImportJob() {
        Job job = Mockito.mock(Job.class);
        Mockito.when(job.getName()).thenReturn("voterImportJob");
        return job;
    }

    @Bean(name = "candidateImportJob")
    Job candidateImportJob() {
        Job job = Mockito.mock(Job.class);
        Mockito.when(job.getName()).thenReturn("candidateImportJob");
        return job;
    }
}