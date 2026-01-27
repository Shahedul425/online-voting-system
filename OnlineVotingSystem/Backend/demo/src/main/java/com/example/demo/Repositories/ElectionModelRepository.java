package com.example.demo.Repositories;

import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Models.ElectionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ElectionModelRepository extends JpaRepository<ElectionModel, UUID> {
    Optional<ElectionModel> findById(UUID id);
    List<ElectionModel> findByOrganizationIdAndStatus(UUID organizationId, ElectionStatus status);
    @Query("select e from ElectionModel e where e.status=:status")
    List<ElectionModel> findByStatusAAndOrganizationId(ElectionStatus status, UUID organizationId);
    List<ElectionModel> findByOrganizationId(UUID organizationId);

}
