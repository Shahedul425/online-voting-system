package com.example.demo.authcontroller;

import com.example.demo.AuthService.LoginService;
import com.example.demo.AuthService.RegisterService;
import com.example.demo.Exception.KeycloakEmailAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class AuthController {
    private final LoginService loginService;
    private final RegisterService registerService;

    public AuthController(LoginService loginService, RegisterService registerService) {
        this.loginService = loginService;
        this.registerService = registerService;
    }

    @PostMapping("/public/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        Map<String,Object> token = loginService.login(username, password);
        String accessToken = (String) token.get("access_token");

        Map<String, Object> userInfo = loginService.getUserInfo(accessToken);

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "roles", userInfo.get("roles"),
                "user", userInfo
        ));
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
            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (KeycloakEmailAlreadyExistsException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already exists"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unknown registration error"));
        }
    };

}
