package com.example.demo.TestController;

import com.example.demo.AuthService.RegisterService;
import com.example.demo.Exception.KeycloakEmailAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestController {
    private final RegisterService registerService;

    public TestController(RegisterService registerService) {
        this.registerService = registerService;
    }

    @GetMapping("/public/ping")
    public String ping() { return "Public OK"; }

    @GetMapping("/voter/secure")
    public String voterSecure() { return "Voter Access OK"; }

    @GetMapping("/admin/secure")
    public String adminSecure() { return "Admin Access OK"; }

}
