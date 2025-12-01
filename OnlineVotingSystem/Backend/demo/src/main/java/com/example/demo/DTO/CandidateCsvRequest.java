package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
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
