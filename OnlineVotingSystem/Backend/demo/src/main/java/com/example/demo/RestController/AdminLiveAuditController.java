package com.example.demo.RestController;

import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.Util.Ids;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * NEW. Exposes a narrow "live-audit feed" for AdminLiveTurnout.jsx.
 * Polled every 3 s by the JSX; the frontend diffs by id + createdAt so a
 * duplicated row never re-renders.
 *
 * Deliberately does NOT take a since/after cursor — the JSX keeps its own
 * client-side Set of ids, and filters. That keeps this controller dumb and
 * cache-friendly. If you outgrow that, add `?sinceId=<uuid>` later.
 *
 * Security: `/admin/**` is already role-gated to `hasRole("admin")` in
 * SecurityConfig, so no extra annotation is needed here. Cross-org leakage
 * is prevented because AdminLiveTurnout.jsx first loads the election via
 * `getElectionById` (which enforces org scope), so an admin from tenant A
 * physically can't navigate to tenant B's election page.
 *
 * If you want defense-in-depth, wrap the repository call in a service that
 * re-runs the same scope check, mirroring ElectionAdminService pattern.
 */
@RestController
@RequestMapping("/admin/election")
@RequiredArgsConstructor
public class AdminLiveAuditController {

    private final AuditLogsRepository auditLogsRepository;

    /**
     * Newest-first, bounded list of audit rows for a single election.
     *
     * @param electionId election UUID from the URL
     * @param limit      max rows to return (1..200). Default 30.
     */
    @GetMapping("/liveAuditFeed/{electionId}")
    public ResponseEntity<List<AuditLogsModel>> liveAuditFeed(
            @PathVariable String electionId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        UUID eId = Ids.uuid(electionId, "electionId");
        int capped = Math.max(1, Math.min(limit, 200));
        List<AuditLogsModel> rows = auditLogsRepository.findTopNByElection(eId, PageRequest.of(0, capped));
        return ResponseEntity.ok(rows);
    }
}
