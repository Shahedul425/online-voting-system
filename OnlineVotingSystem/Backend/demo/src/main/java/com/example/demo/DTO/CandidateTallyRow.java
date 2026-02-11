package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class CandidateTallyRow {
    private String position;
    private UUID candidateId;
    private String firstName;
    private String lastName;
    private String ballotSerial;
    private String photoUrl;
    private long votes;
}