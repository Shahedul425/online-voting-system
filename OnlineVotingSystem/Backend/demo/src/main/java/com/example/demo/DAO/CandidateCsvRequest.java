package com.example.demo.DAO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CandidateCsvRequest {
    private String firstName;
    private String lastName;
    private String photoUrl;
    private String position;
    private String ballotSerial;
    private Integer lineNumber;
    private String party;
}
