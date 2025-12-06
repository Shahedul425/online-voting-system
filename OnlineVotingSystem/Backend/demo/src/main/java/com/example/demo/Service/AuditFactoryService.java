package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.ServiceInterface.AuditFactoryInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditFactoryService implements AuditFactoryInterface {
    private final AuditLogsRepository logsRepository;
    private final ElectionModelRepository electionModelRepository;
    private final OrganizationRepository organizationRepository;
    private final UserModelRepository userModelRepository;


    @Override
    public AuditLogsModel build(AuditLogsRequest auditLogsRequest) {
        AuditLogsModel auditLogsModel = new AuditLogsModel();
        ElectionModel electionModel = electionModelRepository.findById(UUID.fromString(auditLogsRequest.getElectionId())).orElse(null);
        OrganizationModel organizationModel = organizationRepository.findById(UUID.fromString(auditLogsRequest.getOrganizationId())).orElse(null);
        UserModel userModel = userModelRepository.findById(UUID.fromString(auditLogsRequest.getActor())).orElse(null);
        if(userModel == null){
            throw new RuntimeException("User not found");
        }
        if (electionModel == null) {
            throw new RuntimeException("Election not found");
        }
        if (organizationModel == null) {
            throw new RuntimeException("Organization not found");
        }
        auditLogsModel.setAction(auditLogsRequest.getAction());
        auditLogsModel.setActor(userModel);
        auditLogsModel.setDetails(auditLogsRequest.getDetails());
        auditLogsModel.setElection(electionModel);
        auditLogsModel.setOrganization(organizationModel);
        auditLogsModel.setCreatedAt(LocalDateTime.now());
        auditLogsModel.setEntityId(auditLogsRequest.getEntityId());
        auditLogsModel.setStatus(auditLogsRequest.getStatus());
        auditLogsModel.setHttpStatus(auditLogsRequest.getHttpStatus());
        logsRepository.save(auditLogsModel);
        return auditLogsModel;
    }
}
