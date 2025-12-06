package com.example.demo.Service;
import com.example.demo.DTO.TokenDTO;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoterListModelRepository;
import com.example.demo.ServiceInterface.VerificationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService implements VerificationServiceInterface {
    private final VoterListModelRepository volterListModelRepository;
    private final ElectionModelRepository electionModelRepository;
    private final OneTimeTokenService oneTimeTokenService;
    private final VerificationAttemptService verificationAttemptService;
    private final  UserInfoService userInfoService;
    @Override
    public TokenDTO verfication(String voterId, String electionId) {

        UUID requestId = UUID.randomUUID();
        UUID electionId1 = UUID.fromString(electionId);
        OneTokenModel token = null;
        ElectionModel electionModel = electionModelRepository.findById(electionId1).orElse(null);
        if (electionModel == null) {
            throw new RuntimeException("Election not found");
        }
        boolean eligible;

        UserModel user = userInfoService.getCurrentUser();
        Optional<VoterListModel> voter = volterListModelRepository.findByElectionIdAndVoterIdAndEmail(electionId1, voterId, user.getEmail());
//        if(voter == null) {
//            throw new RuntimeException("Voter not found");
//        }
        if (voter.isPresent()) {
            voter.get().setVerified(true);
            eligible =!voter.get().isBlocked()&&!voter.get().isHasVoted();
            volterListModelRepository.save(voter.get());
        }else{
            eligible = false;
        }
        if(eligible){
            token = oneTimeTokenService.issueToken(
                    String.valueOf(requestId),
                    electionModel,voter.get());
        }
//Verification Model As a whole will be removed and no longer need a db table
        verificationAttemptService.build(
                electionModel,
                user,
                voter.get(),
                String.valueOf(requestId),
                eligible);


        return TokenDTO.builder()
                .expiryTime(token.getExpiresAt())
                .tokenId(token.getTokenId())
                .build();

    }

    @Override
    public boolean isEligible(String email, String voterId) {
        return false;
    }


}
