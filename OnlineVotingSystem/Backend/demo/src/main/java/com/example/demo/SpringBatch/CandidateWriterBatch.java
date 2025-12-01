package com.example.demo.SpringBatch;

import com.example.demo.Models.CandidateUploadStaging;
import com.example.demo.Repositories.CandidateListStagingRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemStreamWriter;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

@StepScope
@Component
@RequiredArgsConstructor
public class CandidateWriterBatch implements ItemWriter<CandidateUploadStaging> {
    private final CandidateListStagingRepo candidateListStagingRepo;
    @Override
    public void write(Chunk<? extends CandidateUploadStaging> chunk) throws Exception {
        candidateListStagingRepo.saveAll(chunk.getItems());
    }
}
