package com.example.demo.ServiceInterface;

import com.example.demo.Models.OneTokenModel;

import java.util.UUID;

public interface TokenServiceInterface {
    OneTokenModel issueToken(String requestId, UUID electionId, UUID voterId);
    void cosumeToken(String requestId);
}
