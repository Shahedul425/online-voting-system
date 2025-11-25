package com.example.demo.Repositories;

import com.example.demo.Models.ElectionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ElectionModelRepository extends JpaRepository<ElectionModel, UUID> {
}
