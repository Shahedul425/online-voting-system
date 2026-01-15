package com.example.demo.Exception;

public class NotFoundException extends ApiException{
    public NotFoundException(String code, String message) {
        super(code, message);
    }
}
