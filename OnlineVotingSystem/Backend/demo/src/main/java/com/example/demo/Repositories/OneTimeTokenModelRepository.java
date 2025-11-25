package com.example.demo.Repositories;

import com.example.demo.Models.OneTokenModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OneTimeTokenModelRepository extends JpaRepository<OneTokenModel, UUID> {
}
