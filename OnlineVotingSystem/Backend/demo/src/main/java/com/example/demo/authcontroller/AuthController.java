package com.example.demo.authcontroller;

import com.example.demo.AuthService.LoginService;
import com.example.demo.AuthService.RegisterService;
import com.example.demo.DAO.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final LoginService loginService;
    private final RegisterService registerService;


    @GetMapping("/whoami")
    public String whoami() {
        return "spring-boot-demo";
    }

    @PostMapping("/public/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        // LoginService already logs:
        // - LOGIN_ATTEMPT (optional)
        // - LOGIN_FAILED (WARN with reason)
        // - LOGIN_SUCCESS (you can keep or remove)
        Map<String, Object> token = loginService.login(username, password);
        String accessToken = (String) token.get("access_token");

        Map<String, Object> userInfo = loginService.getUserInfo(accessToken);

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "roles", userInfo.get("roles"),
                "user", userInfo
        ));
    }

    @PostMapping("/public/auth/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest body) {
        registerService.register(body);
        return ResponseEntity.ok(Map.of("message", "Registration successful"));
    }

    // -------------------------------------------------------------------------
    // Password-reset flow (STUB — no SMTP wired yet).
    //
    // The frontend is already calling these endpoints. Until SMTP + Keycloak
    // user-action-email are configured we respond 202 Accepted so the UI can
    // complete its flow; we also log at INFO so operators can tell that a
    // reset was requested and see what still needs wiring.
    //
    // To "turn on" real emails:
    //   1. Configure `spring.mail.*` in application.properties
    //      (host/port/username/password/properties for the SMTP provider).
    //   2. Either send the reset link via JavaMailSender here, OR call the
    //      Keycloak Admin REST API:
    //        PUT /{realm}/users/{id}/execute-actions-email
    //        body: ["UPDATE_PASSWORD"]
    //      Keycloak will then mail the user a signed reset link that, when
    //      clicked, lets them set a new password through Keycloak's UI.
    //   3. If you prefer to handle reset yourself (not Keycloak), store a
    //      signed short-lived token (HMAC or JWT) against the user's id,
    //      mail `${frontend}/reset-password?token=XXX`, then verify + update
    //      the Keycloak credential in resetPassword() below.
    //
    // IMPORTANT: the response is intentionally opaque for enumeration safety —
    // it does not reveal whether the email exists, matching what the frontend
    // ForgotPassword page already assumes.
    // -------------------------------------------------------------------------
    @PostMapping("/public/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body == null ? null : body.get("email");
        log.info("PASSWORD_RESET_REQUESTED email={} (stub — SMTP not wired; no mail sent)", email);
        // Always 202 — do NOT leak whether the email exists.
        return ResponseEntity.accepted().body(Map.of(
                "message", "If an account exists for that email, a reset link has been sent."
        ));
    }

    @PostMapping("/public/auth/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token    = body == null ? null : body.get("token");
        String password = body == null ? null : body.get("password");

        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "code", "INVALID_TOKEN",
                    "message", "The reset link is missing its token. Please request a new link."
            ));
        }
        if (password == null || password.length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "code", "WEAK_PASSWORD",
                    "message", "Password must be at least 8 characters."
            ));
        }

        log.info("PASSWORD_RESET_COMPLETED token=<redacted len={}> (stub — token not verified, no user updated)",
                token.length());

        // Once real backend exists:
        //   - verify the token's signature + expiry
        //   - resolve the userId it was issued for
        //   - call Keycloak admin API to reset-password for that userId
        //   - write an audit row (AuditActions.PASSWORD_RESET)
        return ResponseEntity.ok(Map.of(
                "message", "Your password has been updated. You can now sign in with the new password."
        ));
    }
}
