package com.example.demo.Repositories;

import com.example.demo.Models.VerificationAttemptModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VerificationModelRepository extends JpaRepository<VerificationAttemptModel, UUID> {
}
