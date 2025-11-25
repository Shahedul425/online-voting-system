package com.example.demo.Service;
import com.example.demo.Models.OneTokenModel;
import com.example.demo.ServiceInterface.TokenServiceInterface;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OneTimeTokenService implements TokenServiceInterface {
    @Override
    public OneTokenModel issueToken(String requestId, UUID electionId, UUID voterId) {
        return null;
    }

    @Override
    public void cosumeToken(String requestId) {

    }
}
