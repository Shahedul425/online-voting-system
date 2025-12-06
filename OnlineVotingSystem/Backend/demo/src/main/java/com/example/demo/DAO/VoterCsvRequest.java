package com.example.demo.DAO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@Data
public class VoterCsvRequest {
    private String voterId;
    private String email;
    private Integer lineNumber;
}
