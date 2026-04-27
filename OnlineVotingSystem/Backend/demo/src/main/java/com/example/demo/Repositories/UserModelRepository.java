package com.example.demo.Repositories;

import com.example.demo.Enums.Role;
import com.example.demo.Models.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserModelRepository extends JpaRepository<UserModel, UUID> {
    Optional<UserModel> findByKeycloakId(String keycloakId);
    Optional<UserModel>  findByEmail(String email);
    UserModel findByOrganizationId(UUID organizationId);

    Optional<Object> findByEmailIgnoreCase(String email);

    // Used by SuperAdminController to surface platform-wide admin counts and lists.
    List<UserModel> findAllByRole(Role role);

    List<UserModel> findAllByOrganizationIdAndRole(UUID organizationId, Role role);
}
