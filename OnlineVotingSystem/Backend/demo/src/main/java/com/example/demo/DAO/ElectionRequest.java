package com.example.demo.DAO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
@Getter
@Setter
@Component
public class ElectionRequest {
    private String name;
    private String description;
    private String electionType;
    private String status;
    private String code;
    private String merkleRoot;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
