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
    @Query("select vt.receiptHashToken from VoteModel vt where vt.electionId = :id")
    public List<String> findReceiptTokensByElectionId(UUID id);
}
