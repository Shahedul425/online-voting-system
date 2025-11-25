package com.example.demo.Service;

import com.example.demo.Models.AuditLogsModel;
import com.example.demo.ServiceInterface.AuditServiceInterface;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditService implements AuditServiceInterface {
    @Override
    public void logAction() {

    }

    @Override
    public List<AuditLogsModel> searchAuditLogs() {
        return List.of();
    }
}
