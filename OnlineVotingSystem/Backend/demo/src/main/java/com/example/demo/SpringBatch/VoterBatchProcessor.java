package com.example.demo.SpringBatch;

import com.example.demo.DTO.VoterCsvRequest;
import com.example.demo.Models.VoterUploadStaging;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@StepScope
public class VoterBatchProcessor implements ItemProcessor<VoterCsvRequest,VoterUploadStaging> {
    @Value("#{jobParameters['jobId']}")
    private UUID jobId;

    @Value("#{jobParameters['electionId']}")
    private UUID electionId;

    private Set<String> emailSeen = new HashSet<>();
    private Set<String> voterSeen = new HashSet<>();

    @Override
    public VoterUploadStaging process(VoterCsvRequest item) throws Exception {
        VoterUploadStaging voterUploadStaging = new VoterUploadStaging();
        voterUploadStaging.setJobId(jobId);
        voterUploadStaging.setElectionId(electionId);
        voterUploadStaging.setVoterId(item.getVoterId());
        voterUploadStaging.setEmail(item.getEmail());
        voterUploadStaging.setLineNumber(item.getLineNumber());
        voterUploadStaging.setCreatedAt(LocalDateTime.now());

        if(item.getVoterId()==null||item.getVoterId().isBlank()){
            voterUploadStaging.setValid(false);
            voterUploadStaging.setErrorMessage("VoterId is missing");
            return voterUploadStaging;
        }
        if (item.getEmail()==null||item.getEmail().isBlank()){
            voterUploadStaging.setValid(false);
            voterUploadStaging.setErrorMessage("Email is missing");
            return voterUploadStaging;
        }
        if (!emailSeen.add(item.getEmail())) {
            voterUploadStaging.setValid(false);
            voterUploadStaging.setErrorMessage("Duplicate email");
            return voterUploadStaging;
        }
        if (!voterSeen.add(item.getVoterId())) {
            voterUploadStaging.setValid(false);
            voterUploadStaging.setErrorMessage("Duplicate voterId");
            return voterUploadStaging;
        }
        voterUploadStaging.setValid(true);
        return voterUploadStaging;
    }
}
