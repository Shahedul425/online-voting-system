package com.example.demo.DAO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
@Getter
@Setter
public class ElectionRequest {

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name max length is 200")
    private String name;

    @Size(max = 2000, message = "description max length is 2000")
    private String description;

    @NotBlank(message = "electionType is required")
    @Size(max = 50, message = "electionType max length is 50")
    private String electionType;

    @NotNull(message = "startTime is required")
    private LocalDateTime startTime;

    @NotNull(message = "endTime is required")
    private LocalDateTime endTime;
}