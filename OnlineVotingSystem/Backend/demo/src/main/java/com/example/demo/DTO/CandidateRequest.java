package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
@Getter
@Setter
public class CandidateRequest {
    private String firstName;
    private String lastName;
    private String photoUrl;
    private String position;
    private String ballotSerial;
}
