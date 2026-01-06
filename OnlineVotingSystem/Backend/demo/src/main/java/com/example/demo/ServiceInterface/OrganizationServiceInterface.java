package com.example.demo.ServiceInterface;

import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Models.OrganizationModel;

import java.util.List;

public interface OrganizationServiceInterface {
     OrganizationModel findById(String id);
     String addOrganization(OrganizationRequest organization);
     String updateOrganization(OrganizationRequest organization);
}
