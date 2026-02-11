package com.example.demo.Repositories;

import com.example.demo.Models.VoteModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteModelRepository extends JpaRepository<VoteModel, UUID> {
    public Optional<VoteModel> findById(UUID id);
    @Query("select vt.receiptHashToken from VoteModel vt where vt.electionId.id = :id")
    public List<String> findReceiptTokensByElectionId(UUID id);
    @Query("select v from VoteModel v where v.electionId.id = :electionId order by v.createdAt asc, v.id asc")
    List<VoteModel> findByElectionOrdered(UUID electionId);


    public VoteModel findVoteModelByReceiptHashToken(String receiptHashToken);


    public long countByElectionId_Id(UUID electionId);

    Optional<VoteModel> findByRequestId(String requestId);

}
