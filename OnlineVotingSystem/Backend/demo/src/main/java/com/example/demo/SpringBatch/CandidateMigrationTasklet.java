package com.example.demo.SpringBatch;

import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.CandidateUploadStaging;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.CandidateListRepository;
import com.example.demo.Repositories.CandidateListStagingRepo;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.UserModelRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CandidateMigrationTasklet implements Tasklet {
    private final CandidateListStagingRepo candidateListStagingRepo;
    private final CandidateListRepository candidateListRepository;
    private final ElectionModelRepository electionModelRepository;
    private final UserModelRepository userModelRepository;
    private static int chunkSize = 500;

    @Override
    @Transactional
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        StepExecution stepExecution = chunkContext.getStepContext().getStepExecution();
        JobParameters jobParameters = stepExecution.getJobParameters();        UUID jobId = UUID.fromString(jobParameters.getString("jobId"));
        UUID electionId = UUID.fromString(jobParameters.getString("electionId"));
        String importerId = jobParameters.getString("importerId");
        long invalidCount = candidateListStagingRepo.countInvalidByJobId(jobId);
        if (invalidCount > 0) {
            throw new RuntimeException("Validation failed: " + invalidCount + " invalid rows.");
        }
        long totalStaging = candidateListStagingRepo.countByJobId(jobId);
        if (totalStaging == 0) {
            throw new RuntimeException("CSV contains 0 voter rows");
        }

        int page = 0;
        Page<CandidateUploadStaging> chunk;
        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        UserModel userModel = userModelRepository.findById(UUID.fromString(importerId)).orElse(null);
        if (electionModel == null) {
            throw new RuntimeException("Election not found.");
        }
        if (userModel == null) {
            throw new RuntimeException("User not found.");
        }
        do{
            chunk = candidateListStagingRepo.findAllByJobId(jobId, PageRequest.of(page,chunkSize));
            List<CandidateListModel> candidateListModel = chunk.stream().map(s->{
                CandidateListModel candidateListModel1 = new CandidateListModel();

                candidateListModel1.setElectionId(electionModel);
                candidateListModel1.setFirstName(s.getFirstName());
                candidateListModel1.setLastName(s.getLastName());
                candidateListModel1.setBallotSerial(s.getBallotSerial());
                candidateListModel1.setLastName(s.getLastName());
                candidateListModel1.setPosition(s.getPosition());
                candidateListModel1.setPhotoUrl(s.getPhotoUrl());
                candidateListModel1.setImportedBy(userModel);
                candidateListModel1.setImportedAt(LocalDateTime.now());
                return candidateListModel1;
            }).toList();
            if (!candidateListModel.isEmpty()){
                candidateListRepository.saveAll(candidateListModel);
            }
            page++;
        }while (chunk.hasNext());

        electionModel.setCandidateListUploaded(true);
        electionModelRepository.save(electionModel);
        candidateListStagingRepo.deleteAllByJobId(jobId);


        return RepeatStatus.FINISHED;
    }
}
