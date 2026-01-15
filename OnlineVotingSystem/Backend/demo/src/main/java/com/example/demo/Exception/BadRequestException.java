package com.example.demo.Exception;

public class BadRequestException extends ApiException{
    public BadRequestException(String code, String message) {
        super(code, message);
    }
}
