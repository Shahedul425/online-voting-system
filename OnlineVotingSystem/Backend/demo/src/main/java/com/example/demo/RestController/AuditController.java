package com.example.demo.RestController;

import com.example.demo.DAO.AuditSearchRequest;
import com.example.demo.Service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    @PostMapping("/search")
    public ResponseEntity<?> search(@RequestBody AuditSearchRequest request) {
            return ResponseEntity.ok(
                    auditService.searchAuditLogs(request)
            );
    }
    @GetMapping("/{electionId}/{auditId}")
    public ResponseEntity<?> getAudit(@PathVariable String electionId, @PathVariable String auditId) {
        return ResponseEntity.ok(auditService.findAuditById(electionId,auditId));
    }
}
