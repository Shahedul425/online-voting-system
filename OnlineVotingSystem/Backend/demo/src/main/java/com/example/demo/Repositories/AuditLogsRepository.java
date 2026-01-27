package com.example.demo.Repositories;

import com.example.demo.Models.AuditLogsModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogsRepository extends JpaRepository<AuditLogsModel, UUID>, JpaSpecificationExecutor<AuditLogsModel> {

    List<AuditLogsModel> findAllByElectionId(UUID electionId);
}
