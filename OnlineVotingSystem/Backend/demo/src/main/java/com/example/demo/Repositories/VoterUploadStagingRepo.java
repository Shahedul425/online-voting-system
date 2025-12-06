package com.example.demo.Repositories;

import com.example.demo.Models.VoterUploadStaging;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VoterUploadStagingRepo extends JpaRepository<VoterUploadStaging, UUID> {

    List<VoterUploadStaging> findAllByJobId(UUID jobId);

    @Query("SELECT COUNT(v) FROM VoterUploadStaging v WHERE v.jobId = :jobId AND v.valid = false")
    long countInvalidByJobId(@Param("jobId") UUID jobId);

    @Query("SELECT v FROM VoterUploadStaging v WHERE v.jobId = :jobId AND v.valid = false ORDER BY v.lineNumber")
    List<VoterUploadStaging> findInvalidRowsByJobId(@Param("jobId") UUID jobId);

    @Modifying
    @Query("DELETE FROM VoterUploadStaging v WHERE v.jobId = :jobId")
    void deleteAllByJobId(@Param("jobId") UUID jobId);

    @Query("SELECT count(v) from VoterUploadStaging v where v.jobId=:jobId")
    long countByJobId(@Param("jobId") UUID jobId);

    Page<VoterUploadStaging> findAllByJobId(UUID jobId, Pageable pageable);
}