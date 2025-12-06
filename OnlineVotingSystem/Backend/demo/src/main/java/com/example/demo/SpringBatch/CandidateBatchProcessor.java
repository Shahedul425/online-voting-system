package com.example.demo.SpringBatch;

import com.example.demo.DAO.CandidateCsvRequest;
import com.example.demo.Models.CandidateUploadStaging;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

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
        candidateUploadStaging.setLineNumber(item.getLineNumber());
        candidateUploadStaging.setPhotoUrl(item.getPhotoUrl());
        candidateUploadStaging.setPosition(item.getPosition());

        List<String> errors = new ArrayList<>();


        if(item.getPosition()==null||item.getPosition().isBlank()){
            errors.add("Candidate Position is Missing");
        }
        if(item.getParty()==null||item.getParty().isBlank()){
            errors.add("Candidate Party is Missing");
        }
        if(item.getLastName()==null||item.getLastName().isBlank()){
            errors.add("Candidate lastName is Missing");
        }
        if(item.getFirstName()==null||item.getFirstName().isBlank()){
            errors.add("Candidate firstName is Missing");
        }
        if(item.getBallotSerial()==null||item.getBallotSerial().isBlank()){
            errors.add("Candidate ballotSerial is Missing");
        }
        if(item.getBallotSerial()!=null && !item.getBallotSerial().isBlank()){
            if(!seenBallot.add(item.getBallotSerial())) {
                errors.add("Duplicate Ballot Serial");
            }
        }
        if(!errors.isEmpty()){
            candidateUploadStaging.setValid(false);
            candidateUploadStaging.setErrorMessage(String.join(";",errors));
        }else {
            candidateUploadStaging.setValid(true);
        }
        return candidateUploadStaging;
    }
}
