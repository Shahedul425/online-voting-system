package com.example.demo.SpringBatch;

import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Models.VoterUploadStaging;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.Repositories.VoterUploadStagingRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepContribution;
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
public class VoterMigrationTasklet implements Tasklet {
    private final VoterUploadStagingRepo voterUploadStagingRepo;
    private final ElectionModelRepository electionModelRepository;
    private final VoterListModelRepository voterListModelRepository;

    private static int chunkSize = 2000;
    @Override
    @Transactional
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        JobParameters jobParameters = contribution.getStepExecution().getJobParameters();
        UUID jobId = UUID.fromString(jobParameters.getString("jobId"));
        UUID electionId = UUID.fromString(jobParameters.getString("electionId"));
//        String voterId = jobParameters.getString("voterId");
//        String email = jobParameters.getString("email");

        long invalidCount = voterUploadStagingRepo.countInvalidByJobId(jobId);

        if (invalidCount > 0) {
            throw new RuntimeException("Validation failed: " + invalidCount + " invalid rows.");
        }
        long totalStaging = voterUploadStagingRepo.countByJobId(jobId);
        if (totalStaging == 0) {
            throw new RuntimeException("CSV contains 0 voter rows");
        }


        int page = 0;
        Page<VoterUploadStaging> chunk;
        ElectionModel election = electionModelRepository.findById(electionId).orElse(null);
        if (election == null) {
            throw new RuntimeException("Election not found");
        }
        do{
            chunk = voterUploadStagingRepo.findAllByJobId(jobId, PageRequest.of(page,chunkSize));
            List<VoterListModel> toSave = chunk.stream().map(s->{
                VoterListModel voter = new VoterListModel();
                voter.setElection(election);
                voter.setVoterId(s.getVoterId());
                voter.setEmail(s.getEmail());
                voter.setBlocked(false);
                voter.setVerified(false);
                voter.setHasVoted(false);
                voter.setImportedAt(LocalDateTime.now());
//                voter.setImportedBy();
                return voter;
            }).collect(Collectors.toList());
            if(!toSave.isEmpty()){
                voterListModelRepository.saveAll(toSave);
            }
            page++;

        }while (chunk.hasNext());
        election.setVoterListUploaded(true);
        electionModelRepository.save(election);

        // cleanup staging for this job
        voterUploadStagingRepo.deleteAllByJobId(jobId);

        return RepeatStatus.FINISHED;
    }
}
