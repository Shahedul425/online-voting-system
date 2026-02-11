package com.example.demo.DTO;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

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
    private int rank;               // 1..n
    private boolean winner;         // rank==1
}