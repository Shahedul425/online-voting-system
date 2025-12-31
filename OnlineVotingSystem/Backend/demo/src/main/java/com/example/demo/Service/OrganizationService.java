package com.example.demo.Service;

import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.ServiceInterface.OrganizationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService implements OrganizationServiceInterface {
    private final OrganizationRepository organizationRepository;


    @Override
    public OrganizationModel findById(String id) {
        UUID organizationId = UUID.fromString(id);
        return organizationRepository.findById(organizationId).orElse(null);
    }

    @Override
    public String addOrganization(OrganizationRequest organization) {
        OrganizationModel organizationModel = new OrganizationModel();
        organizationModel.setName(organization.getName());
        organizationModel.setCountry(organization.getCountry());
        organizationModel.setType(organization.getType());
        organizationModel.setAllowedDomains(organization.getAllowedDomains());
        organizationRepository.save(organizationModel);
        return "Organization added successfully";
    }

    @Override
    public String updateOrganization(OrganizationRequest organization) {
        return "";
    }
}
