package com.example.demo.Service;
import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.VoteModel;
import com.example.demo.Repositories.CandidateListRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.ServiceInterface.CommitServiceInterface;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VoteCommitService implements CommitServiceInterface {
    private final OneTimeTokenService oneTimeTokenService;
    private final ElectionModelRepository electionModelRepository;
    private final VoteModelRepository voteModelRepository;
    private final CandidateListRepository candidateListRepository;
    private final HashService hashService;

    @Override
    @Transactional
    public String commitVote(UUID electionId, UUID candidateId, String tokenId) {
        boolean isTokenValid = oneTimeTokenService.validateToken(tokenId);
        String reciptToken = hashService.generateOneTimeToke(electionId, candidateId);
        CandidateListModel candidateListModel = candidateListRepository.findById(candidateId).orElse(null);
        ElectionModel electionModel = electionModelRepository.findById(electionId).orElse(null);
        if (!isTokenValid) {
            throw new RuntimeException("Invalid token");
        }
        if (electionModel == null) {
            throw new RuntimeException("Election not found");
        }
        if (candidateListModel == null) {
            throw new RuntimeException("Candidate list not found");
        }
        VoteModel voteModel = new VoteModel();
        voteModel.setCandidateId(candidateListModel);
        voteModel.setElectionId(electionModel);
        voteModel.setCreatedAt(LocalDateTime.now());
        voteModel.setReceiptHashToken(reciptToken);
        voteModelRepository.save(voteModel);
        oneTimeTokenService.cosumeToken(UUID.fromString(tokenId));

        return reciptToken;
    }
}
