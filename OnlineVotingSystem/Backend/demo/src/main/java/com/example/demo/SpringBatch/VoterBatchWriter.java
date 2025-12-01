package com.example.demo.SpringBatch;

import com.example.demo.Models.VoterUploadStaging;
import com.example.demo.Repositories.VoterUploadStagingRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VoterBatchWriter implements ItemWriter<VoterUploadStaging> {

    private final VoterUploadStagingRepo voterUploadStagingRepo;


    @Override
    public void write(Chunk<? extends VoterUploadStaging> chunk) throws Exception {
        voterUploadStagingRepo.saveAll(chunk.getItems());
    }
}
