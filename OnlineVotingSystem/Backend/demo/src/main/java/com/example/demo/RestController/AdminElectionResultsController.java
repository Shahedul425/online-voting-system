package com.example.demo.RestController;

import com.example.demo.DTO.ElectionResultsResponse;
import com.example.demo.Service.AdminElectionResultService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static net.logstash.logback.argument.StructuredArguments.kv;
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/election")
public class AdminElectionResultsController {

    private final AdminElectionResultService electionResultsService;

    @GetMapping("/results/{electionId}")
    public ResponseEntity<ElectionResultsResponse> adminResults(@PathVariable String electionId) {
        return ResponseEntity.ok(electionResultsService.getAdminResults(electionId));
    }
}

