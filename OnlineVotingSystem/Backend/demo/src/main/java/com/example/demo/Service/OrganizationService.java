package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.ServiceInterface.OrganizationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService implements OrganizationServiceInterface {
    private final OrganizationRepository organizationRepository;
    private final SafeAuditService auditService;
    private UserInfoService userService;


    @Override
    public OrganizationModel findById(String id) {
        UUID organizationId = UUID.fromString(id);
        return organizationRepository.findById(organizationId).orElse(null);
    }

    @Override
    public String addOrganization(OrganizationRequest organization) {
        try {
            OrganizationModel organizationModel = new OrganizationModel();
            organizationModel.setName(organization.getName());
            organizationModel.setCountry(organization.getCountry());
            organizationModel.setType(organization.getType());
            organizationModel.setAllowedDomains(organization.getAllowedDomains());
            OrganizationModel organizationModel1 =  organizationRepository.save(organizationModel);
            auditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userService.getCurrentUser().getId().toString())
                            .electionId(null)
                            .organizationId(organizationModel1.getId().toString())
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.CREATE_ORGANIZATION.toString())
                            .status(ActionStatus.SUCCESS.toString())
                            .details("Organization Created Successfully")
                            .entityId("OrganizationModel")
                            .build()
            );
            return "Organization added successfully";
        }catch (BusinessException e){
            auditService.audit(
                    AuditLogsRequest.builder()
                            .actor(userService.getCurrentUser().getId().toString())
                            .electionId("None")
                            .organizationId(null)
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.CREATE_ORGANIZATION.toString())
                            .status(ActionStatus.FAILED.toString())
                            .details("Organization Creation Failed due to: "+ e.getMessage())
                            .entityId("OrganizationModel")
                            .build()
            );
            throw e;
        }

    }

    @Override
    public String updateOrganization(OrganizationRequest organization) {
        return "";
    }
}
