package com.example.demo.Repositories;

import com.example.demo.Models.AuditLogsModel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Drop-in replacement. Adds two helpers required by the new JSX:
 *   - findTopNByElection — paged "tail" for the live audit feed.
 *   - findAllByElection_IdOrderByCreatedAtDesc — used by the audit bundle ZIP.
 *
 * The original `findAllByElectionId(UUID)` method is kept so existing callers
 * compile.
 */
@Repository
public interface AuditLogsRepository
        extends JpaRepository<AuditLogsModel, UUID>,
                JpaSpecificationExecutor<AuditLogsModel> {

    /** Kept for backwards compatibility. */
    List<AuditLogsModel> findAllByElectionId(UUID electionId);

    /**
     * Newest-first, bounded-N feed for AdminLiveTurnout.jsx.
     * Use PageRequest.of(0, limit) at the call site.
     * The `election.id` path walks through the @ManyToOne ElectionModel on AuditLogsModel.
     */
    @Query("select a from AuditLogsModel a where a.election.id = :electionId order by a.createdAt desc")
    List<AuditLogsModel> findTopNByElection(@Param("electionId") UUID electionId, Pageable page);

    /** All rows for an election, newest first — powers the audit-log.csv inside the bundle. */
    @Query("select a from AuditLogsModel a where a.election.id = :electionId order by a.createdAt desc")
    List<AuditLogsModel> findAllByElectionDesc(@Param("electionId") UUID electionId);
}
