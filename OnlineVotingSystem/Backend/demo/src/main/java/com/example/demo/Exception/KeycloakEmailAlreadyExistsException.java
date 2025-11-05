package com.example.demo.Exception;

public class KeycloakEmailAlreadyExistsException extends RuntimeException {
    public KeycloakEmailAlreadyExistsException(String message) {
        super(message);
    }
}