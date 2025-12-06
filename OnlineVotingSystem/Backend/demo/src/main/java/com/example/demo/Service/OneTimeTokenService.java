package com.example.demo.Service;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OneTimeTokenModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.TokenServiceInterface;
import jakarta.el.ELClass;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OneTimeTokenService implements TokenServiceInterface {
    private final ElectionModelRepository electionModelRepository;
    private final VoterListModelRepository voterListModelRepository;
    private final OneTimeTokenModelRepository oneTimeTokenModelRepository;
    @Override
    public OneTokenModel issueToken(String requestId, ElectionModel electionModel, VoterListModel voterId) {
//        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
//        if (electionModel == null) {
//            throw new RuntimeException("Election not found");
//        }
//        VoterListModel voter = voterListModelRepository.findById(voterId).orElse(null);
//        if(voter == null) {
//            throw new RuntimeException("Voter not found");
//        }


        OneTokenModel oneTokenModel = new OneTokenModel();
        oneTokenModel.setIssuedAt(LocalDateTime.now());
        oneTokenModel.setElection(electionModel);
        oneTokenModel.setConsumed(false);
        oneTokenModel.setVoter(voterId);
        oneTokenModel.setTokenId(UUID.randomUUID().toString());
        oneTokenModel.setRequestId(requestId);
        oneTokenModel.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        oneTimeTokenModelRepository.save(oneTokenModel);

        return oneTokenModel;
    }

    @Override
    public void cosumeToken(UUID tokenId) {
        OneTokenModel oneTokenModel = oneTimeTokenModelRepository.findById(tokenId).orElse(null);
        if(oneTokenModel == null) {
            throw new RuntimeException("OneTimeToken not found");
        }
        oneTokenModel.setConsumed(true);
        oneTimeTokenModelRepository.save(oneTokenModel);

    }

    @Override
    public boolean validateToken(String tokenId) {
        OneTokenModel oneTokenModel = oneTimeTokenModelRepository.findByRequestId(tokenId);
        return oneTokenModel != null && !oneTokenModel.getExpiresAt().isBefore(LocalDateTime.now()) && !oneTokenModel.isConsumed();
    }
}
