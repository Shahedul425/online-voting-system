package com.example.demo.RestController;

import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Models.UserModel;
import com.example.demo.Service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/org")
@RequiredArgsConstructor
public class OrganizationController {
    private final OrganizationService organizationService;

    @PostMapping("/create")
    public ResponseEntity<?> createOrganization(@RequestBody OrganizationRequest organizationRequest){
        organizationService.addOrganization(organizationRequest);
        return ResponseEntity.ok().build();
    }
}
