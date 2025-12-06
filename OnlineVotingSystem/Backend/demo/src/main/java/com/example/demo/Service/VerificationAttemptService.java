package com.example.demo.Service;

import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VerificationAttemptModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.Repositories.VerificationAttemptModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VerificationAttemptService {
    private final VerificationAttemptModelRepository verificationAttemptModelRepository;
    private final UserModelRepository userModelRepository;
    private final ElectionModelRepository electionModelRepository;
    private final VoterListModelRepository voterListModelRepository;
    public void build(ElectionModel electionId,UserModel userId,VoterListModel voterId,String requestId,boolean isVerified) {

//        Optional<ElectionModel> electionModel = electionModelRepository.findById(UUID.fromString(electionId));
//        UserModel userModel = userModelRepository.findById(UUID.fromString(userId)).orElse(null);
//        VoterListModel voterListModel = voterListModelRepository.findById(UUID.fromString(voterId)).orElse(null);
//        if(!electionModel.isPresent()) {
//            throw new RuntimeException("Election not found");
//        }
//        if(userModel == null) {
//            throw new RuntimeException("User not found");
//        }
//        if(voterListModel == null) {
//            throw new RuntimeException("VoterList not found");
//        }
        VerificationAttemptModel verificationAttemptModel = new VerificationAttemptModel();
        verificationAttemptModel.setUser(userId);
        verificationAttemptModel.setElection(electionId);
        verificationAttemptModel.setVoter(voterId);
        verificationAttemptModel.setCreatedAt(LocalDateTime.now());
        verificationAttemptModel.setVoterIdVerified(isVerified);
        verificationAttemptModel.setRequestId(requestId);
        verificationAttemptModelRepository.save(verificationAttemptModel);
    }
}
