package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Auditable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SafeAuditService {
    private final AuditFactoryService auditFactoryService;

    public void audit(AuditLogsRequest auditLogsRequest) {
        try{
            auditFactoryService.build(auditLogsRequest);
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
