package com.example.demo.ServiceInterface;

import com.example.demo.Models.AuditLogsModel;

import java.util.List;

public interface AuditServiceInterface {
    void logAction();
    List<AuditLogsModel> searchAuditLogs();
}
