package com.example.demo.Repositories;

import com.example.demo.Models.VoteSelectionModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VoteSelectionRepository extends JpaRepository<VoteSelectionModel, UUID> {

}
