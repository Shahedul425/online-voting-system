package com.example.demo.Repositories;

import com.example.demo.Models.OrganizationModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<OrganizationModel, UUID> {
    Optional<OrganizationModel> findById(UUID id);
    @Query("SELECT o FROM OrganizationModel o JOIN o.allowedDomains d WHERE d = :domain")
    Optional<OrganizationModel> findByDomain(@Param("domain") String domain);
}

