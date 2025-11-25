package com.example.demo.ServiceInterface;

import com.example.demo.Models.UserModel;

public interface UserInfoService {
    String findOrCreateUser(String token);
    UserModel getByKeyCloakId(String keyCloakId);
}
