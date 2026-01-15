package com.example.demo.DAO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class CandidateCsvRequest {

    @NotBlank(message = "firstName is required")
    @Size(max = 100, message = "firstName max length is 100")
    private String firstName;

    @NotBlank(message = "lastName is required")
    @Size(max = 100, message = "lastName max length is 100")
    private String lastName;

//    @Size(max = 500, message = "photoUrl max length is 500")
    private String photoUrl;

    @NotBlank(message = "position is required")
    @Size(max = 100, message = "position max length is 100")
    private String position;

    @NotBlank(message = "ballotSerial is required")
    @Size(max = 50, message = "ballotSerial max length is 50")
    private String ballotSerial;

    @NotBlank(message = "party is required")
    @Size(max = 100, message = "party max length is 100")
    private String party;

    @Min(value = 1, message = "lineNumber must be >= 1")
    private Integer lineNumber;
}