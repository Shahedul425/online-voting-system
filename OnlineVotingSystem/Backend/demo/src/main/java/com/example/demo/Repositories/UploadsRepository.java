package com.example.demo.Repositories;

import com.example.demo.Models.Uploads;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UploadsRepository extends JpaRepository<Uploads, UUID> {
}
