package com.example.demo.RestController;

import com.example.demo.DAO.ElectionRequest;
import com.example.demo.DAO.ElectionUpdateRequest;
import com.example.demo.Models.CandidateListModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.VoterListModel;
import com.example.demo.Service.ElectionAdminService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/election")
@RequiredArgsConstructor
public class ElectionController {
    private final ElectionAdminService electionAdminService;

    @PostMapping("/create")
    public ResponseEntity<?> createElection(@RequestBody ElectionRequest electionRequest) {
        electionAdminService.createElection(electionRequest);
        return ResponseEntity.ok().build();
    }
    @PostMapping("update")
    public ResponseEntity<?> updateElection(@RequestParam String id, @RequestBody ElectionUpdateRequest electionRequest) {
        electionAdminService.updateElection(id,electionRequest);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/start/{id}")
    public ResponseEntity<?> startElection(@PathVariable String id) {
        electionAdminService.startElection(id);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/stop/{id}")
    public ResponseEntity<?> stopElection(@PathVariable String id) {
        electionAdminService.stopElection(id);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/close/{id}")
    public ResponseEntity<?> closeElection(@PathVariable String id) {
        electionAdminService.closeElection(id);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/publish/{id}")
    public ResponseEntity<?> publishElection(@PathVariable String id) {
        electionAdminService.publishElectionResult(id);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/ActiveElections/{id}")
    public List<ElectionModel> getActiveElections(@PathVariable String id) {
        return electionAdminService.getActiveElections(id);
    }
    @GetMapping("/AllCandidate/{electionId}")
    public List<CandidateListModel> getAllCandidate(@PathVariable String electionId) {
        return electionAdminService.getCandidateList(electionId);
    }
    @GetMapping("/ElectionByStatus")
    public List<ElectionModel> getElectionByStatus(@RequestParam String status) {
        return electionAdminService.getElectionByStatus(status);
    }
    @GetMapping("/VoterListByElection/{id}")
    public List<VoterListModel> getVoterListByElection(@PathVariable String id) {
        return electionAdminService.getVoterList(id);
    }
    @GetMapping("/ElectionById/{id}")
    public ElectionModel getElectionById(@PathVariable String id) {
        return electionAdminService.getElectionById(id);
    }
    @GetMapping("/TotalVoterByElection/{id}")
    public Long getTotalVoterByElection(@PathVariable String id) {
       return electionAdminService.totalVoters(id);
    }
    @GetMapping("/TotalCandidateByElection/{id}")
    public Long getTotalCandidateByElection(@PathVariable String id) {
        return electionAdminService.totalCandidates(id);
    }
    @GetMapping("/all/{id}")
    public List<ElectionModel> getAll(@PathVariable String id) {
       return electionAdminService.getAllElections(id);
    }
}
