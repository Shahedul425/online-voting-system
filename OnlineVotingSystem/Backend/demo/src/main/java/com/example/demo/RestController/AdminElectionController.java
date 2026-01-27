package com.example.demo.RestController;

import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Service.ElectionAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/election")
@RequiredArgsConstructor
public class AdminElectionController {

    private final ElectionAdminService electionAdminService;

    @PostMapping("/create")
    public ResponseEntity<ElectionModel> createElection(@Valid @RequestBody ElectionRequest electionRequest) {
        ElectionModel created = electionAdminService.createElection(electionRequest);
        return ResponseEntity.ok(created); // or ResponseEntity.status(201).body(created)
    }

    // Keep your original style: /election/update?id=...
    // But better: /election/{id}
    @PostMapping("/update")
    public ResponseEntity<String> updateElection(@RequestParam String id,
                                                 @Valid @RequestBody ElectionUpdateRequest request) {
        return ResponseEntity.ok(electionAdminService.updateElection(id, request));
    }

    @PostMapping("/start/{id}")
    public ResponseEntity<Void> startElection(@PathVariable String id) {
        electionAdminService.startElection(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/stop/{id}")
    public ResponseEntity<Void> stopElection(@PathVariable String id) {
        electionAdminService.stopElection(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/close/{id}")
    public ResponseEntity<Void> closeElection(@PathVariable String id) {
        electionAdminService.closeElection(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/publish/{id}")
    public ResponseEntity<Void> publishElection(@PathVariable String id) {
        electionAdminService.publishElectionResult(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ActiveElections/{orgId}")
    public ResponseEntity<List<ElectionModel>> getActiveElections(@PathVariable String orgId) {
        return ResponseEntity.ok(electionAdminService.getActiveElections(orgId));
    }

    @GetMapping("/AllCandidate/{electionId}")
    public ResponseEntity<List<CandidateListModel>> getAllCandidate(@PathVariable String electionId) {
        return ResponseEntity.ok(electionAdminService.getCandidateList(electionId));
    }

    @GetMapping("/ElectionByStatus")
    public ResponseEntity<List<ElectionModel>> getElectionByStatus(@RequestParam String status,@RequestParam String orgId) {
        return ResponseEntity.ok(electionAdminService.getElectionByStatus(status,orgId));
    }

    @GetMapping("/VoterListByElection/{electionId}")
    public ResponseEntity<List<VoterListModel>> getVoterListByElection(@PathVariable String electionId) {
        return ResponseEntity.ok(electionAdminService.getVoterList(electionId));
    }

    @GetMapping("/ElectionById/{id}")
    public ResponseEntity<ElectionModel> getElectionById(@PathVariable String id) {
        return ResponseEntity.ok(electionAdminService.getElectionById(id));
    }

    @GetMapping("/TotalVoterByElection/{electionId}")
    public ResponseEntity<Long> getTotalVoterByElection(@PathVariable String electionId) {
        return ResponseEntity.ok(electionAdminService.totalVoters(electionId));
    }

    @GetMapping("/TotalCandidateByElection/{electionId}")
    public ResponseEntity<Long> getTotalCandidateByElection(@PathVariable String electionId) {
        return ResponseEntity.ok(electionAdminService.totalCandidates(electionId));
    }

    @GetMapping("/all/{orgId}")
    public ResponseEntity<List<ElectionModel>> getAll(@PathVariable String orgId) {
        return ResponseEntity.ok(electionAdminService.getAllElections(orgId));
    }

}