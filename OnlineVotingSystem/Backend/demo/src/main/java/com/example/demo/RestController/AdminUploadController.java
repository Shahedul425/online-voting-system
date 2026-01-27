package com.example.demo.RestController;

import com.example.demo.DAO.ImportReport;
import com.example.demo.Service.AdminUploadService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/election/upload")
@Validated
public class AdminUploadController {

    private final AdminUploadService adminUploadService;

    @PostMapping("/voters")
    public ResponseEntity<ImportReport> uploadVoters(
            @RequestParam("file") MultipartFile file,
            @RequestParam("electionId") @NotNull UUID electionId,
            @RequestParam("voterIdColumn") @NotBlank String voterIdColumn,
            @RequestParam("emailColumn") @NotBlank String emailColumn
    ) throws Exception {

        ImportReport report = adminUploadService.importVoterList(
                file,
                electionId,
                voterIdColumn,
                emailColumn
        );

        // Spring Batch usually returns STARTED/RUNNING etc
        // Return 202 Accepted for async job
        if ("COMPLETED".equalsIgnoreCase(report.getStatus())) {
            return ResponseEntity.ok(report);
        }
        return ResponseEntity.accepted().body(report);
    }

    @PostMapping("/candidate")
    public ResponseEntity<ImportReport> uploadCandidate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("electionId") @NotNull UUID electionId
    ) throws Exception {

        ImportReport report = adminUploadService.importCandidateList(file, electionId);

        if ("COMPLETED".equalsIgnoreCase(report.getStatus())) {
            return ResponseEntity.ok(report);
        }
        return ResponseEntity.accepted().body(report);
    }
}