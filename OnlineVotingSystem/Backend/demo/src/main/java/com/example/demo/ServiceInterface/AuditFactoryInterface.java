package com.example.demo.ServiceInterface;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Models.AuditLogsModel;

public interface AuditFactoryInterface {
    AuditLogsModel build(AuditLogsRequest auditLogsRequest);
}
