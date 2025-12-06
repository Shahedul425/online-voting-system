package com.example.demo.ServiceInterface;

import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.Models.VoterListModel;

import java.util.UUID;

public interface TokenServiceInterface {
    OneTokenModel issueToken(String requestId, ElectionModel electionId, VoterListModel voterId);
    void cosumeToken(UUID tokenId);
    boolean validateToken(String tokenId);
}
