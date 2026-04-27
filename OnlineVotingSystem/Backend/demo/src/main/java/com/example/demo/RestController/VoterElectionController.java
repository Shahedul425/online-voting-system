package com.example.demo.RestController;

import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Service.ElectionAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Drop-in replacement. Adds `GET /voter/election/ElectionById/{id}` so the
 * voter-side pages (VoterElectionDetail, VoterBallot, VoterReceipt,
 * VoteSubmitted) no longer have to hit the admin path
 * (`/admin/election/ElectionById/{id}`) — they would be blocked by the
 * role-based path matching in SecurityConfig anyway.
 *
 * Cross-org scoping is already handled inside ElectionAdminService
 * (`getElectionOrThrowAndScope`) so the voter path inherits the same check.
 * Admin-only fields on `ElectionModel` (createdBy, flags) are still exposed
 * for now — if that's a concern, return a voter-safe projection instead.
 */
@RestController
@RequestMapping("/voter/election")
@RequiredArgsConstructor
public class VoterElectionController {

    private final ElectionAdminService electionAdminService;

    @GetMapping("/ActiveElections/{orgId}")
    public ResponseEntity<List<ElectionModel>> getActiveElections(@PathVariable String orgId) {
        return ResponseEntity.ok(electionAdminService.getActiveElections(orgId));
    }

    @GetMapping("/AllCandidate/{electionId}")
    public ResponseEntity<List<CandidateListModel>> getAllCandidate(@PathVariable String electionId) {
        return ResponseEntity.ok(electionAdminService.getCandidateList(electionId));
    }

    /** NEW — voter-scoped single-election lookup. */
    @GetMapping("/ElectionById/{id}")
    public ResponseEntity<ElectionModel> getElectionById(@PathVariable String id) {
        return ResponseEntity.ok(electionAdminService.getElectionById(id));
    }
}
