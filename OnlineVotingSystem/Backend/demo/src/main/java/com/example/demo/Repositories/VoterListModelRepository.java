package com.example.demo.Repositories;

import com.example.demo.Models.VoterListModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VoterListModelRepository extends JpaRepository<VoterListModel, UUID> {
    boolean existsByElectionIdAndVoterId(UUID electionId, String voterId);
    boolean existsByElectionIdAndEmail(UUID electionId, String email);
}
