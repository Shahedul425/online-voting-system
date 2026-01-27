package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Auditable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SafeAuditService {
    private final AuditFactoryService auditFactoryService;



    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void audit(AuditLogsRequest req) {
        try {
            auditFactoryService.build(req);
        } catch (Exception ignored) {
            // never let audit logging break business logic
        }
    }
}
