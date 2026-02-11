package com.example.demo.RestController;

import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static net.logstash.logback.argument.StructuredArguments.kv;

@RestController
@RequestMapping("/superadmin")
@RequiredArgsConstructor
@Slf4j
public class SuperAdminController {

    private final OrganizationService organizationService;

    @PostMapping("/org/create")
    public ResponseEntity<String> createOrganization(@Valid @RequestBody OrganizationRequest organizationRequest) {
        // ✅ No INFO log (noise). RequestTimingFilter already records method/path/status/duration
        return ResponseEntity.ok(organizationService.addOrganization(organizationRequest));
    }

    @PostMapping("/org/assign/admin")
    public ResponseEntity<?> assignAdminToOrganization(@RequestParam String email, @RequestParam String orgId) {
        // ✅ No INFO log (noise). Failures/rejections are logged in service.
        return ResponseEntity.ok(organizationService.assignOrgAdmin(email, UUID.fromString(orgId)));
    }
}
