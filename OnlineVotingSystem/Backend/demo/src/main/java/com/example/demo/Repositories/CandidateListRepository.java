package com.example.demo.Repositories;

import com.example.demo.Models.CandidateListModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateListRepository extends JpaRepository<CandidateListModel, UUID> {
    long countByElectionId_Id(UUID electionId);
    List<CandidateListModel> findAllByElectionId_Id(UUID electionId);

    // Optional but very useful: fetch candidate only if it belongs to election
    @Query("""
        SELECT c
          FROM CandidateListModel c
         WHERE c.id = :candidateId
           AND c.electionId.id = :electionId
    """)
    Optional<CandidateListModel> findByIdAndElectionId(
            @Param("candidateId") UUID candidateId,
            @Param("electionId") UUID electionId
    );
}
