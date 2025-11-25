package com.example.demo.Service;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.example.demo.Enums.Role;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.UserModelRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class UserInfoService implements com.example.demo.ServiceInterface.UserInfoService {
    private final UserModelRepository userModelRepository;
    private final JwtService jwtService;
    public UserInfoService(UserModelRepository userModelRepository, JwtService jwtService) {
        this.userModelRepository = userModelRepository;
        this.jwtService = jwtService;
    }

    @Override
    public String findOrCreateUser(String token) {
        DecodedJWT decodedJWT = jwtService.decodeJwt(token);
        String keyCloakId = jwtService.extractKeyCloakId(token);
        String email = jwtService.extractEmail(token);
        List<String> roles = jwtService.extractRoles(token);
        UserModel exist = userModelRepository.findByKeycloakId(keyCloakId);
        Role systemRole = mapToRole(roles);
        if (exist != null) {
            return "User Already Exists!!";
        }
        UserModel userModel = new UserModel();
        userModel.setEmail(email);
        userModel.setKeycloakId(keyCloakId);
        userModel.setRole(systemRole);
        userModelRepository.save(userModel);
        return "User created!";


    }
    private Role mapToRole(List<String> roles) {
        for (String r : roles) {
            try {
                return Role.valueOf(r.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        throw new IllegalArgumentException("No valid system role found in token roles");
    }

    @Override
    public UserModel getByKeyCloakId(String keyCloakId) {
        return userModelRepository.findByKeycloakId(keyCloakId);
    }
}
