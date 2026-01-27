package com.example.demo.RestController;


import com.example.demo.DTO.MeResponse;
import com.example.demo.Models.UserModel;
import com.example.demo.Service.UserInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

    private final UserInfoService userInfoService;

    @GetMapping("/me")
    public MeResponse me() {
        UserModel u = userInfoService.getCurrentUser(); // uses JWT keycloakId
        return new MeResponse(
                u.getId(),
                u.getEmail(),
                u.getRole(),
                u.getOrganization() != null ? u.getOrganization().getId() : null
        );
    }
}