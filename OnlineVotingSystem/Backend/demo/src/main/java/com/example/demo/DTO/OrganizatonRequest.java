package com.example.demo.DTO;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.JoinColumn;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.List;
@Getter
@Setter
@Component
public class OrganizatonRequest {
    private String organizationId;
    private String name;
    private String type;
    private List<String> allowedDomains;
    private String country;
}
