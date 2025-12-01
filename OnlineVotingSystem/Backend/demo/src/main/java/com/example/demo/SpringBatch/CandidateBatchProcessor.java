package com.example.demo.SpringBatch;

import com.example.demo.DTO.CandidateCsvRequest;
import com.example.demo.Models.CandidateUploadStaging;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Component
@StepScope
public class CandidateBatchProcessor implements ItemProcessor<CandidateCsvRequest, CandidateUploadStaging> {
    @Value("#{jobParameters['jobId']}")
    private UUID jobId;

    @Value("#{jobParameters['electionId']}")
    private UUID electionId;

    @Value("#{jobParameters['importerId']}")
    private String importerId;

    private final Set<String> seenBallot = new HashSet<>();

    @Override
    public CandidateUploadStaging process(CandidateCsvRequest item) throws Exception {
        CandidateUploadStaging candidateUploadStaging = new CandidateUploadStaging();
        candidateUploadStaging.setJobId(jobId);
        candidateUploadStaging.setElectionId(electionId);
        candidateUploadStaging.setImporterId(importerId);
        candidateUploadStaging.setCreatedAt(LocalDateTime.now());
        candidateUploadStaging.setParty(item.getParty());
        candidateUploadStaging.setBallotSerial(item.getBallotSerial());
        candidateUploadStaging.setFirstName(item.getFirstName());
        candidateUploadStaging.setLastName(item.getLastName());
        candidateUploadStaging.setLineNumber(candidateUploadStaging.getLineNumber());
        candidateUploadStaging.setPhotoUrl(item.getPhotoUrl());
        candidateUploadStaging.setPosition(item.getPosition());

        if(item.getPosition()==null||item.getPosition().isBlank()){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage("Candidate Position is Missing");
        }
        if(item.getParty()==null||item.getParty().isBlank()){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage("Candidate Party is Missing");
        }
        if(item.getLastName()==null||item.getLastName().isBlank()){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage("Candidate lastName is Missing");
        }
        if(item.getFirstName()==null||item.getFirstName().isBlank()){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage("Candidate firstName is Missing");
        }
        if(item.getBallotSerial()==null||item.getBallotSerial().isBlank()){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage("Candidate ballotSerial is Missing");
        }
        if(!seenBallot.add(item.getBallotSerial())){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage("Duplicate Ballot Serial");
        }
        candidateUploadStaging.setValid(true);
        return candidateUploadStaging;
    }
}
