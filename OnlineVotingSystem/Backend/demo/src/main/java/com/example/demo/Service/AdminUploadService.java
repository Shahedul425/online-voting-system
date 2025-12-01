package com.example.demo.Service;

import com.example.demo.DTO.ImportReport;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.SpringBatch.VoterBatchJobConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUploadService {
    private final VoterListModelRepository voterListModelRepository;
    private final ElectionModelRepository electionModelRepository;
    private final JobLauncher jobLauncher;
    private Job VoterImportJob;
    private Job CandidateImportJob;

    public ImportReport importVoterList(
            MultipartFile file,
            UUID electionId,
            UUID importerId,
            String voterIdColumn,
            String emailColumn
            ) throws IOException, JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {

        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        if (electionModel == null) {
            throw  new RuntimeException("Election not found");
        }
        if (electionModel.getStatus()!= ElectionStatus.draft){
            throw new RuntimeException("Only draft elections can be imported");
        }
        if(electionModel.isVoterListUploaded()==Boolean.TRUE){
            throw new RuntimeException("Voter list Already Uploaded");
        }
        File temp = File.createTempFile(UUID.randomUUID().toString()+" VoterList ", ".csv");
        file.transferTo(temp);
        UUID jobId = UUID.randomUUID();
        JobParameters jobParameters = new JobParametersBuilder()
                .addString("filePath",temp.getAbsolutePath())
                .addString("electionId",electionId.toString())
                .addString("jobId",jobId.toString())
                .addString("voterIdColumn",voterIdColumn)
                .addString("emailColumn",emailColumn)
                .addString("importerId",importerId.toString())
                .addLong("timestamp", System.currentTimeMillis())
                .toJobParameters();

        JobExecution jobExecution = jobLauncher.run(VoterImportJob,jobParameters);
        ImportReport importReport = new ImportReport();
        importReport.setStatus(jobExecution.getStatus().toString());
        importReport.setJobId(jobId.toString());
        importReport.setErrorFilePath(temp.getAbsolutePath());
        return importReport;

    };
    public ImportReport importCandidateList(
            MultipartFile file,
            UUID electionId,
            UUID importerId
    ) throws IOException, JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        if (electionModel == null) {
            throw  new RuntimeException("Election not found");
        }
        if (electionModel.getStatus()!= ElectionStatus.draft){
            throw new RuntimeException("Only draft elections can be imported");
        }
        if (electionModel.isCandidateListUploaded()==Boolean.TRUE){
            throw new RuntimeException("Candidate list Already Uploaded");
        }
        File temp = File.createTempFile(UUID.randomUUID().toString()+" candidateList","csv");
        file.transferTo(temp);
        UUID jobId = UUID.randomUUID();
        JobParameters jobParameters = new JobParametersBuilder()
                .addString("filepath",temp.getAbsolutePath())
                .addString("electionId",electionId.toString())
                .addString("jobId",jobId.toString())
                .addString("importerId",importerId.toString())
                .toJobParameters();
        JobExecution jobExecution = jobLauncher.run(CandidateImportJob,jobParameters);
        ImportReport importReport = new ImportReport();
        importReport.setStatus(jobExecution.getStatus().toString());
        importReport.setJobId(jobId.toString());
        importReport.setErrorFilePath(temp.getAbsolutePath());
        return importReport;


    }
}
