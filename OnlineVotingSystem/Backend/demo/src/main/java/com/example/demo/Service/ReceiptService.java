package com.example.demo.Service;
import com.example.demo.ServiceInterface.ReceiptServiceInterface;
import org.springframework.stereotype.Service;

@Service
public class ReceiptService implements ReceiptServiceInterface {
    @Override
    public String generateReceiptHash(String commitment, String tokenId) {
        return "";
    }
}
