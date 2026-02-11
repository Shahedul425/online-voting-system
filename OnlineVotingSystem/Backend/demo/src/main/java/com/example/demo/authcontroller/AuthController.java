package com.example.demo.authcontroller;

import com.example.demo.AuthService.LoginService;
import com.example.demo.AuthService.RegisterService;
import com.example.demo.DAO.RegisterRequest;
import com.example.demo.Exception.UnAuthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

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
}
