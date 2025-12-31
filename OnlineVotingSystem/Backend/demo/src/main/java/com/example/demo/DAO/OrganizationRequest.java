package com.example.demo.DAO;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Data
public class OrganizationRequest {
    private String name;
    private String type;
    private List<String> allowedDomains;
    private String country;
}
