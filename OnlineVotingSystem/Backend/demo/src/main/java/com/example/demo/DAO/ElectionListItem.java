package com.example.demo.DAO;

import com.example.demo.Enums.ElectionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lightweight projection of {@link com.example.demo.Models.ElectionModel} +
 * pre-aggregated voter / candidate / ballot counts.
 *
 * Used by AdminElections and VoterElections so the listing pages don't have
 * to N+1 query for each row's counts.
 *
 * Returned by {@code GET /admin/election/all/{orgId}}.
 */
public record ElectionListItem(
        UUID id,
        String name,
        String description,
        String electionType,
        ElectionStatus status,
        LocalDateTime startTime,
        LocalDateTime endTime,
        LocalDateTime publishedAt,
        LocalDateTime createdAt,
        boolean isVoterListUploaded,
        boolean isCandidateListUploaded,
        long totalVoters,
        long totalCandidates,
        long votedCount,
        String merkleRoot
) {}
