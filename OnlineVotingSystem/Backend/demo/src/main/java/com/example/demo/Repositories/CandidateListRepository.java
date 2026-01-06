package com.example.demo.Repositories;

import com.example.demo.Models.CandidateListModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateListRepository extends JpaRepository<CandidateListModel, UUID> {
    long countByElectionId_Id(UUID electionId);
    List<CandidateListModel> findAllByElectionId_Id(UUID electionId);
}
