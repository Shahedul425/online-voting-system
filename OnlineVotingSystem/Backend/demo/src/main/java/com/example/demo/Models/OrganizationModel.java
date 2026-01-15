package com.example.demo.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String type;
    @ElementCollection
    @CollectionTable(
            name = "organization_domains",
            joinColumns = @JoinColumn(name = "organization_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"domain"})
    )
    @Column(name="domain", nullable=false, length=320)
    @NotEmpty
    private List<String> allowedDomains;
    @Column(nullable = false)
    private String country;

}
