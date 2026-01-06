package com.example.demo.Repositories;

import com.example.demo.Models.VoterListModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoterListModelRepository extends JpaRepository<VoterListModel, UUID> {
    boolean existsByElectionIdAndVoterId(UUID electionId, String voterId);
    boolean existsByElectionIdAndEmail(UUID electionId, String email);
    long countByElection_Id(UUID electionId);
    Optional<VoterListModel> findByElectionIdAndVoterIdAndEmail(UUID electionId, String voterId, String email);
    List<VoterListModel> findByElectionId(UUID electionId);
}
