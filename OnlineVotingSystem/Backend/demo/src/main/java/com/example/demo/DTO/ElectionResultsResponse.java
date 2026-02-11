package com.example.demo.DTO;

import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

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
}