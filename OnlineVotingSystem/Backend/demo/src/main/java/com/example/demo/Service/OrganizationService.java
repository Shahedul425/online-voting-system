package com.example.demo.Service;

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
}
