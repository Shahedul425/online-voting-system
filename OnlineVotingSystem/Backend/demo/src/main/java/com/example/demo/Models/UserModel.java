package com.example.demo.Models;

import com.example.demo.Enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private String email;
    @Column(unique = true,nullable = false)
    private String keycloakId;
    @Enumerated(EnumType.STRING)
    private Role role;
    private LocalDateTime createdAt;
    @ManyToOne
    @JoinColumn(name = "organizationId")
    private OrganizationModel organization;
}
