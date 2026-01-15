package com.example.demo.Repositories;

import com.example.demo.Models.OneTokenModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OneTimeTokenModelRepository extends JpaRepository<OneTokenModel, UUID> {
    Optional<OneTokenModel> findByTokenId(String tokenId);

    Optional<OneTokenModel> findByRequestId(String requestId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE OneTokenModel t
           SET t.isConsumed = true
         WHERE t.id = :id
           AND t.isConsumed = false
    """)
    int consumeIfNotConsumed(@Param("id") UUID id);
}
