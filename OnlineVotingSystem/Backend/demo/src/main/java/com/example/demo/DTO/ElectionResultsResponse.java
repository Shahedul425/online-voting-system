package com.example.demo.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Drop-in replacement.
 * CHANGE: adds publication-masthead fields the AdminResults.jsx + VoterResults.jsx
 *   - turnoutTimeline (24 bucket hourly turnout)
 *   - peakHour
 *   - firstBallotAt, lastBallotAt
 *   - shareUrl (public verify link)
 * All new fields are nullable / defaultable — old callers still compile.
 *
 * See AdminElectionResultServicePatch.md for how to populate the new fields.
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ElectionResultsResponse {
    private UUID electionId;
    private String electionName;
    private String electionType;

    private UUID organizationId;
    private String organizationName;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime publishedAt;

    private String merkleRootB64;

    private long totalVoters;
    private long votedCount;
    private double turnoutPercent;

    private long ballotsCast; // VoteModel count
    private Map<String, List<CandidateResultRow>> resultsByPosition = new LinkedHashMap<>();

    // ─── NEW publication-masthead fields ────────────────────────────────────
    /** 24 integers, one per hour of a single day, counting ballots cast in that hour bucket. */
    private List<Long> turnoutTimeline = new ArrayList<>();

    /** ISO-8601 UTC timestamp of the very first ballot in this election. Nullable. */
    private LocalDateTime firstBallotAt;

    /** ISO-8601 UTC timestamp of the very last ballot in this election. Nullable. */
    private LocalDateTime lastBallotAt;

    /** Human label for the peak hour, e.g. "14:00–15:00". Nullable. */
    private String peakHour;

    /** Public verify URL, e.g. "https://trustvote.example/verify-receipt?election=<id>". Nullable. */
    private String shareUrl;
}
