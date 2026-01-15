package com.example.demo.DAO;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;


@Getter
@Setter
public class OrganizationRequest {

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name max length is 200")
    private String name;

    @NotBlank(message = "type is required")
    @Size(max = 50, message = "type max length is 50")
    private String type;

    @NotEmpty(message = "allowedDomains cannot be empty")
    private List<@NotBlank(message = "domain cannot be blank") @Size(max = 253, message = "domain too long") String> allowedDomains;

    @NotBlank(message = "country is required")
    @Size(max = 100, message = "country max length is 100")
    private String country;
}