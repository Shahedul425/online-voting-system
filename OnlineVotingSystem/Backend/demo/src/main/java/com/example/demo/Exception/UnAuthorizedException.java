package com.example.demo.Exception;

public class UnAuthorizedException extends ApiException {
    public UnAuthorizedException(String code, String message) {
        super(code, message);
    }

    public static UnAuthorizedException invalidCredentials(String message) {
        return new UnAuthorizedException("INVALID_CREDENTIALS", message);
    }
}
