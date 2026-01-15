package com.example.demo.Exception;

public class ForbiddenException extends ApiException{
    public ForbiddenException(String code, String message) {
        super(code, message);
    }
}
