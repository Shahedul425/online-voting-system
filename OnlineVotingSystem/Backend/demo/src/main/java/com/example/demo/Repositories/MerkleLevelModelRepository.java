package com.example.demo.Repositories;

import com.example.demo.Models.MerkelLevelModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MerkleLevelModelRepository extends JpaRepository <MerkelLevelModel, UUID>{
    Optional<MerkelLevelModel> findByElection_IdAndLevel(UUID electionId, int level);
}
