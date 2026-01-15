package com.example.demo.DAO;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;


@Getter
@Setter
public class ElectionUpdateRequest {

    @Size(max = 200, message = "name max length is 200")
    private String name;

    @Size(max = 2000, message = "description max length is 2000")
    private String description;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
}