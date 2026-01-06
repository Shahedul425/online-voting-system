package com.example.demo.ServiceInterface;

import com.example.demo.DAO.AuditSearchRequest;
import com.example.demo.Models.AuditLogsModel;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AuditServiceInterface {
    void logAction();
    Page<AuditLogsModel> searchAuditLogs(AuditSearchRequest auditSearchRequest);
    AuditLogsModel findAuditById(String auditId,String electionId);
}
