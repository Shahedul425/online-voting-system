package com.example.demo.DTO;

import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.UserModel;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Component
@Data
public class VoterCsvRequest {
    private String voterId;
    private String email;
    private Integer lineNumber;
}
