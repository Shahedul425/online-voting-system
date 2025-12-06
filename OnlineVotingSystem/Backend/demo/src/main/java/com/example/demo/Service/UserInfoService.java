package com.example.demo.Service;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.example.demo.Enums.Role;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserInfoService implements com.example.demo.ServiceInterface.UserInfoService {

    private final UserModelRepository userModelRepository;
    private final SecurityUtils securityUtils;


    @Override
    public String findOrCreateUser() {
        String keycloakId = securityUtils.getKeycloakId();
        String email = securityUtils.getEmail();
        List<String> roles = securityUtils.getRealmRoles();

        if (keycloakId == null || email == null) {
            throw new RuntimeException("Missing or invalid JWT — user not authenticated.");
        }

        Role systemRole = mapToRole(roles);

        boolean exists = userModelRepository.findByKeycloakId(keycloakId).isPresent();

        if (exists) {
            return "User already exists!";
        } else {
            UserModel newUser = new UserModel();
            newUser.setKeycloakId(keycloakId);
            newUser.setEmail(email);
            newUser.setRole(systemRole);
            userModelRepository.save(newUser);
            return "User created!";
        }
    }


    private Role mapToRole(List<String> roles) {
        for (String r : roles) {
            if (r.equalsIgnoreCase("admin")) return Role.admin;
            if (r.equalsIgnoreCase("voter")) return Role.voter;
        }
        return Role.voter; // default fallback
    }

    @Override
    public UserModel getByKeyCloakId(String keyCloakId) {
        return userModelRepository.findByKeycloakId(keyCloakId).orElse(null);
    }

    @Override
    public UserModel getCurrentUser() {
        String kcId = securityUtils.getKeycloakId();
        return getByKeyCloakId(kcId);
    }


}