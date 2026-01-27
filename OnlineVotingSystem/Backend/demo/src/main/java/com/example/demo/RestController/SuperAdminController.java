package com.example.demo.RestController;

import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Service.ElectionAdminService;
import com.example.demo.Service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final OrganizationService organizationService;
    private final ElectionAdminService electionAdminService;

    @PostMapping("/org/create")
    public ResponseEntity<String> createOrganization(@Valid @RequestBody OrganizationRequest organizationRequest) {
        return ResponseEntity.ok(organizationService.addOrganization(organizationRequest));
    }
    @PostMapping("/org/assign/admin")
    public ResponseEntity<?> assignAdminToOrganization(@RequestParam String email,@RequestParam String orgId){
        return ResponseEntity.ok(organizationService.assignOrgAdmin(email, UUID.fromString(orgId)));
    }

}