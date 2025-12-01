package com.example.demo.ServiceInterface;

import com.example.demo.Models.UserModel;

public interface UserInfoService {
    String findOrCreateUser();
    UserModel getByKeyCloakId(String keyCloakId);
    UserModel getCurrentUser();
}
