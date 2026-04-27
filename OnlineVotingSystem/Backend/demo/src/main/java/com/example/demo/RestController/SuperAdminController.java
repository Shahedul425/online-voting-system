package com.example.demo.RestController;

import com.example.demo.DAO.AdminListItem;
import com.example.demo.DAO.OrganizationRequest;
import com.example.demo.Enums.Role;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.Service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/superadmin")
@RequiredArgsConstructor
@Slf4j
public class SuperAdminController {

    private final OrganizationService organizationService;
    private final UserModelRepository userModelRepository;

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

    @GetMapping("/org/all")
    public  ResponseEntity<?> findAll(){
        return ResponseEntity.ok(organizationService.allOrganizations());
    }

    /**
     * Platform-wide list of every user with role=admin.
     *
     * Used by:
     *   • SuperDashboard — to compute total org-admin count and "recent admins".
     *   • SuperOrgs      — to compute per-org admin counts and surface admin lists.
     */
    @GetMapping("/admins")
    public ResponseEntity<List<AdminListItem>> listAllAdmins() {
        List<AdminListItem> admins = userModelRepository.findAllByRole(Role.admin)
                .stream()
                .map(SuperAdminController::toAdminListItem)
                .toList();
        return ResponseEntity.ok(admins);
    }

    /** Admins for a single organisation — useful when drilling into an org card. */
    @GetMapping("/org/{orgId}/admins")
    public ResponseEntity<List<AdminListItem>> listAdminsForOrg(@PathVariable String orgId) {
        UUID id = UUID.fromString(orgId);
        List<AdminListItem> admins = userModelRepository
                .findAllByOrganizationIdAndRole(id, Role.admin)
                .stream()
                .map(SuperAdminController::toAdminListItem)
                .toList();
        return ResponseEntity.ok(admins);
    }

    private static AdminListItem toAdminListItem(UserModel u) {
        return new AdminListItem(
                u.getId(),
                u.getEmail(),
                u.getRole(),
                u.getCreatedAt(),
                u.getOrganization() != null ? u.getOrganization().getId()   : null,
                u.getOrganization() != null ? u.getOrganization().getName() : null
        );
    }
}
