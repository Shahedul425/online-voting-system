package com.example.demo.Repositories;

import com.example.demo.Models.OneTokenModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OneTimeTokenModelRepository extends JpaRepository<OneTokenModel, UUID> {
    @Query("select o from OneTokenModel o where o.requestId=:id")
    OneTokenModel findByRequestId(@Param("id") String requestId);
}
