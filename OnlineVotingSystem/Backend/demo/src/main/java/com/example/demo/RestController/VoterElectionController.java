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
}
