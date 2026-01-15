package com.example.demo.Exception;

public class ConflictException extends ApiException{
    public ConflictException(String code, String message) {
        super(code, message);
    }
}
