package com.example.demo.DAO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Getter
@Setter
public class VoterCsvRequest {

    @NotBlank(message = "voterId is required")
    @Size(max = 100, message = "voterId max length is 100")
    private String voterId;

    @NotBlank(message = "email is required")
    @Email(message = "email is invalid")
    @Size(max = 320, message = "email max length is 320")
    private String email;

    @Min(value = 1, message = "lineNumber must be >= 1")
    private Integer lineNumber;
}