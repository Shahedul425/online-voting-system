package com.example.demo.Repositories;

import com.example.demo.DTO.CandidateTallyRow;
import com.example.demo.Models.VoteSelectionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface VoteSelectionRepository extends JpaRepository<VoteSelectionModel, UUID> {
    @Query("""
        select new com.example.demo.DTO.CandidateTallyRow(
            vs.position,
            c.id,
            c.firstName,
            c.lastName,
            c.ballotSerial,
            c.photoUrl,
            count(vs.id)
        )
        from VoteSelectionModel vs
        join vs.candidateId c
        where vs.vote.electionId.id = :electionId
        group by vs.position, c.id, c.firstName, c.lastName, c.ballotSerial, c.photoUrl
        order by vs.position asc, count(vs.id) desc
    """)
    List<CandidateTallyRow> tallyByElection(@Param("electionId") UUID electionId);
}
