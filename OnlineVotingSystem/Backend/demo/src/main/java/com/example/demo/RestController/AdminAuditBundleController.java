package com.example.demo.RestController;

import com.example.demo.Service.AdminAuditBundleService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * NEW. Exposes the "Download bundle" button on AdminResults.jsx.
 *
 * The ZIP contents (see AdminAuditBundleService for how they're built):
 *   ├── election.json             (pretty-printed ElectionResultsResponse)
 *   ├── merkle-root.txt           (hex/base64 root)
 *   ├── ballots.csv               (anonymised: position, candidate_id, cast_at, leaf_hash)
 *   └── audit-log.csv             (every audit row scoped to this election)
 *
 * Not signed — the Merkle root in election.json already functions as the
 * tamper-evident commitment. Signing is nice-to-have for thesis; see
 * BACKEND_CHANGES.md item #4 if you want to add it later.
 *
 * Security: `/admin/**` is role-gated by SecurityConfig.
 */
@RestController
@RequestMapping("/admin/election")
@RequiredArgsConstructor
public class AdminAuditBundleController {

    private final AdminAuditBundleService bundleService;

    @GetMapping("/{electionId}/auditBundle.zip")
    public ResponseEntity<ByteArrayResource> download(@PathVariable String electionId) {
        byte[] zip = bundleService.buildBundle(electionId);
        ByteArrayResource body = new ByteArrayResource(zip);

        String filename = "audit-bundle-" + electionId + ".zip";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentType(MediaType.parseMediaType("application/zip"));
        headers.setContentLength(zip.length);

        return ResponseEntity.ok().headers(headers).body(body);
    }
}
