package com.example.demo.authcontroller;

import com.example.demo.AuthService.LoginService;
import com.example.demo.AuthService.RegisterService;
import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BusinessException;
import com.example.demo.Exception.KeycloakEmailAlreadyExistsException;
import com.example.demo.Service.SafeAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
@RestController
public class AuthController {
    private final LoginService loginService;
    private final RegisterService registerService;
    private final SafeAuditService safeAuditService;
    public AuthController(LoginService loginService, RegisterService registerService, SafeAuditService safeAuditService) {
        this.loginService = loginService;
        this.registerService = registerService;
        this.safeAuditService = safeAuditService;
    }

    @PostMapping("/public/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

            String username = body.get("username");

            String password = body.get("password");
        try{
            Map<String, Object> token = loginService.login(username, password);
            String accessToken = (String) token.get("access_token");

            Map<String, Object> userInfo = loginService.getUserInfo(accessToken);
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(username)
                            .action(AuditActions.USER_LOGIN.toString())
                            .electionId(null)
                            .organizationId(null)
                            .createdAt(LocalDateTime.now())
                            .entityId("USER")
                            .status(ActionStatus.SUCCESS.toString())
                            .details("User logged in successfully")
                            .build()
            );

            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "roles", userInfo.get("roles"),
                    "user", userInfo
            ));
        }catch (BusinessException e){
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(username)
                            .electionId(null)
                            .organizationId(null)
                            .createdAt(LocalDateTime.now())
                            .action(AuditActions.USER_LOGIN.toString())
                            .entityId("USER")
                            .status(ActionStatus.FAILED.toString())
                            .details("User log in failed due to " + e.getMessage())
                            .build()
            );
            throw e;

        }
    }

    @PostMapping("/public/auth/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String username = body.get("email");
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        String password = body.get("password");

        try {
            registerService.register(username, email, firstName, lastName, password);
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(email)
                            .action(AuditActions.USER_REGISTRATION.toString())
                            .entityId("USER")
                            .status(ActionStatus.SUCCESS.toString())
                            .electionId(null)
                            .organizationId(null)
                            .createdAt(LocalDateTime.now())
                            .details("User registered successfully")
                            .build()
            );

            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (KeycloakEmailAlreadyExistsException ex) {
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(email)
                            .action(AuditActions.USER_REGISTRATION.toString())
                            .entityId("USER")
                            .status(ActionStatus.FAILED.toString())
                            .electionId(null)
                            .organizationId(null)
                            .createdAt(LocalDateTime.now())
                            .details("User registration failed due to " + ex.getMessage())
                            .build()
            );

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already exists"));
        } catch (Exception ex) {
            safeAuditService.audit(
                    AuditLogsRequest.builder()
                            .actor(email)
                            .action(AuditActions.USER_REGISTRATION.toString())
                            .entityId("USER")
                            .status(ActionStatus.FAILED.toString())
                            .electionId(null)
                            .organizationId(null)
                            .createdAt(LocalDateTime.now())
                            .details("User registration failed due to " + ex.getMessage())
                            .build()
            );

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unknown registration error"));
        }
    };

}
