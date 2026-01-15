package com.example.demo.Repositories;

import com.example.demo.Models.VoterListModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoterListModelRepository extends JpaRepository<VoterListModel, UUID> {
    boolean existsByElectionIdAndVoterId(UUID electionId, String voterId);
    boolean existsByElectionIdAndEmail(UUID electionId, String email);
    long countByElection_Id(UUID electionId);
    Optional<VoterListModel> findByElectionIdAndVoterIdAndEmail(UUID electionId, String voterId, String email);
//    List<VoterListModel> findByElectionId(UUID electionId);
    // If you want: list voters by election
    @Query("SELECT v FROM VoterListModel v WHERE v.election.id = :electionId")
    List<VoterListModel> findByElectionId(@Param("electionId") UUID electionId);

    // Count voters by election

    // ✅ Atomic mark voted (prevents double voting races)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE VoterListModel v
           SET v.hasVoted = true,
               v.votedAt = :votedAt
         WHERE v.id = :voterId
           AND v.hasVoted = false
    """)
    int markVotedIfNotVoted(
            @Param("voterId") UUID voterId,
            @Param("votedAt") LocalDateTime votedAt
    );
}
