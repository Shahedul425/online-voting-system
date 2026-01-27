package com.example.demo.Models;

import com.example.demo.Enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(unique = true,nullable = false)
    @NotBlank
    @Size(max = 320)
    @Email
    private String email;
    @Column(unique = true,nullable = false)
    @NotBlank
    private String keycloakId;
    @Enumerated(EnumType.STRING)
    @NotNull
    private Role role;
    private LocalDateTime createdAt;
    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
    @ManyToOne
    @JoinColumn(name = "organizationId", nullable = false)
    private OrganizationModel organization;
}
