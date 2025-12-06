package com.example.demo.ServiceInterface;

import com.example.demo.DTO.TokenDTO;
import com.example.demo.Models.VoterListModel;

public interface VerificationServiceInterface {
    TokenDTO verfication(String voterId, String electionId);
    boolean isEligible(String email, String voterId);
}
