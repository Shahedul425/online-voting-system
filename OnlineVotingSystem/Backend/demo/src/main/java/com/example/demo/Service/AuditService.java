package com.example.demo.Service;

import com.example.demo.DAO.AuditSearchRequest;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.ServiceInterface.AuditServiceInterface;
import com.example.demo.Util.Ids;
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
    public Page<AuditLogsModel> searchAuditLogs(AuditSearchRequest req) {
        if (req.getElectionId() == null) {
            throw new BadRequestException("MISSING_ELECTION_ID", "electionId is required");
        }

        Sort.Direction dir;
        try {
            dir = Sort.Direction.fromString(req.getDirection());
        } catch (Exception e) {
            throw new BadRequestException("INVALID_SORT_DIRECTION", "direction must be ASC or DESC");
        }

        Pageable pageable = PageRequest.of(
                req.getPage(),
                req.getSize(),
                Sort.by(dir, req.getSortBy())
        );

        // service-level: from <= to
        if (req.getFrom() != null && req.getTo() != null && req.getFrom().isAfter(req.getTo())) {
            throw new BadRequestException("INVALID_DATE_RANGE", "`from` must be <= `to`");
        }

        return auditLogsRepository.findAll(AuditSpecification.buid(req), pageable);
    }

    @Override
    public AuditLogsModel findAuditById(String auditId, String electionId) {
        UUID aId = Ids.uuid(auditId, "auditId");
        UUID eId = Ids.uuid(electionId, "electionId");

        AuditLogsModel audit = auditLogsRepository.findById(aId)
                .orElseThrow(() -> new NotFoundException("AUDIT_NOT_FOUND", "Audit log not found"));

        if (audit.getElection() == null) {
            throw new ForbiddenException("AUDIT_NOT_ELECTION_SCOPED", "This audit record is not election-scoped");
        }

        if (!audit.getElection().getId().equals(eId)) {
            throw new ForbiddenException("CROSS_ELECTION_AUDIT_ACCESS", "Cross-election audit access denied");
        }

        return audit;
    }

//    @Override
//    public Page<AuditLogsModel> findAllByElectionId(String electionId) {
//        return auditLogsRepository.findAllByElectionId(UUID.fromString(electionId));
//    }
}
