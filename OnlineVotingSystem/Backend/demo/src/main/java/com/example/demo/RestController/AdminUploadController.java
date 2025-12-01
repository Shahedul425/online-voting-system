package com.example.demo.RestController;

import com.example.demo.DTO.ImportReport;
import com.example.demo.Service.AdminUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/election/upload")
public class AdminUploadController {
    private final AdminUploadService adminUploadService;

    @PostMapping("/voters")
    public ResponseEntity<ImportReport> uploadVoters(
            @RequestParam("file") MultipartFile file,
            @RequestParam("electionId") UUID electionId,
            @RequestParam("importerId") UUID importerId,
            @RequestParam("voterIdColumn") String voterIdColumn,
            @RequestParam("emailColumn") String emailColumn
    ) throws Exception {

        ImportReport report = adminUploadService.importVoterList(
                file,
                electionId,
                importerId,
                voterIdColumn,
                emailColumn
        );

        if ("COMPLETED".equals(report.getStatus()))
            return ResponseEntity.ok(report);

        return ResponseEntity.accepted().body(report);
    }
    @PostMapping("/candidate")
    public ResponseEntity<ImportReport> uploadCandidate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("electionId") UUID electionId,
            @RequestParam("importerId") UUID importerId
    )throws Exception {
        ImportReport report = adminUploadService.importCandidateList(
                file,
                electionId,
                importerId
        );
        if("COMPLETED".equals(report.getStatus())){
            return ResponseEntity.ok(report);
        }
        return ResponseEntity.accepted().body(report);
    }

}
