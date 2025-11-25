package com.example.demo.Repositories;

import com.example.demo.Models.VoteModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VoteModelRepository extends JpaRepository<VoteModel, UUID> {
}
