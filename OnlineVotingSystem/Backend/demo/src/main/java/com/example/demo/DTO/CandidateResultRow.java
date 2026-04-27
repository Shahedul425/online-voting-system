package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Drop-in replacement for the existing DTO.
 * CHANGE: adds `marginOverRunnerUp` and `marginPercent` so the AdminResults +
 * VoterResults publication masthead can show a "won by N votes (X%)" badge.
 *
 * Both fields are nullable (Long / Double) because they are only meaningful
 * for the winner row; everyone else should leave them null.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResultRow {
    private UUID candidateId;
    private String fullName;
    private String ballotSerial;
    private String photoUrl;

    private long votes;
    private double voteSharePercent; // within position
    private int rank;                // 1..n
    private boolean winner;          // rank == 1

    /** NEW — absolute vote margin over the 2nd-place candidate. Null except on the winner. */
    private Long marginOverRunnerUp;
    /** NEW — percentage-point margin over the 2nd-place candidate. Null except on the winner. */
    private Double marginPercent;

    /** Convenience ctor matching the prior 8-arg signature so existing service code still compiles. */
    public CandidateResultRow(UUID candidateId, String fullName, String ballotSerial, String photoUrl,
                              long votes, double voteSharePercent, int rank, boolean winner) {
        this.candidateId = candidateId;
        this.fullName = fullName;
        this.ballotSerial = ballotSerial;
        this.photoUrl = photoUrl;
        this.votes = votes;
        this.voteSharePercent = voteSharePercent;
        this.rank = rank;
        this.winner = winner;
    }
}
