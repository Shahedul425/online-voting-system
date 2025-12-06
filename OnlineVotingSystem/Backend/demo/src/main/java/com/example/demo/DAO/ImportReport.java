package com.example.demo.DAO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class ImportReport {
    private String jobId;
    private String status;
    private String errorFilePath; // optional (you can fill this later)
}
