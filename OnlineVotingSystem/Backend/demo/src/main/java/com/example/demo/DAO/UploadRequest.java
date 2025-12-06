package com.example.demo.DAO;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Component
public class UploadRequest {
    private UUID id;
    private String electionId;
    private String fileType;
    private String fileName;
    private String uploadedBy;
    private String status;
    private LocalDateTime uploadDate;
}
