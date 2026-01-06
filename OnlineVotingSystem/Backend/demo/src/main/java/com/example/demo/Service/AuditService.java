package com.example.demo.Service;

import com.example.demo.DAO.AuditSearchRequest;
import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.ServiceInterface.AuditServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService implements AuditServiceInterface {

    private final AuditLogsRepository auditLogsRepository;

    @Override
    public void logAction() {

    }

    @Override
    public Page<AuditLogsModel> searchAuditLogs(AuditSearchRequest auditSearchRequest) {
        if(auditSearchRequest.getElectionId()==null){
            throw new IllegalArgumentException("Election id cannot be null");
        }
        Pageable pageable = PageRequest.of(
                auditSearchRequest.getPage(),
                auditSearchRequest.getSize(),
                Sort.by(Sort.Direction.fromString(auditSearchRequest.getDirection()),
                        auditSearchRequest.getSortBy())
        );
        return auditLogsRepository.findAll(AuditSpecification.buid(auditSearchRequest),
                pageable);
    }

    @Override
    public AuditLogsModel findAuditById(String auditId,String electionId) {
        AuditLogsModel audit = auditLogsRepository.findById(
                UUID.fromString(auditId)
        ).orElseThrow(() ->
                new RuntimeException("Audit log not found")
        );

        // 🔐 hard enforcement
        if (!audit.getElection().getId().toString().equals(electionId)) {
            throw new SecurityException("Cross-election audit access denied");
        }

        return audit;
      }

}
