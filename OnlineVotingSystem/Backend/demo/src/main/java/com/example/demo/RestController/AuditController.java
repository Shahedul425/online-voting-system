package com.example.demo.RestController;

import com.example.demo.DAO.AuditSearchRequest;
import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping("/search")
    public ResponseEntity<Page<AuditLogsModel>> search(@Valid @RequestBody AuditSearchRequest request) {
        return ResponseEntity.ok(auditService.searchAuditLogs(request));
    }

    @GetMapping("/{electionId}/{auditId}")
    public ResponseEntity<AuditLogsModel> getAudit(@PathVariable String electionId,
                                                   @PathVariable String auditId) {
        // ✅ your previous controller passed params in wrong order
        return ResponseEntity.ok(auditService.findAuditById(auditId, electionId));
    }
}