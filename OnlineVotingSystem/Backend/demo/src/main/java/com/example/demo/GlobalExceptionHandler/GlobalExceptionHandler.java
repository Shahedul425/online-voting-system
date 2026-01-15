package com.example.demo.GlobalExceptionHandler;

import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.ForbiddenException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Records.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {
//    400-DTO Validation errors(@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiError handleMethodArgumentNotValidException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiError.FieldIssue> issues = ex.getBindingResult().getFieldErrors().stream()
                .map(this::toIssue)
                .toList();
        return apiError(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "some fields are invalid",
                request,
                issues
        );
    }
//    400- validation errors on params/path variables
    @ExceptionHandler(ConstraintViolationException.class)
    public ApiError handleConstraintViolationException(ConstraintViolationException ex, HttpServletRequest request) {
        return apiError(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                ex.getMessage(),
                request,
                List.of()
        );
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ApiError handleHttpMessageNotReadableException(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return apiError(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_REQUEST",
                "Request body is malformed or contains invalid values (e.g., invalid UUID).",
                request,
                List.of()
        );
    }
//    400
    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleBadRequestException(BadRequestException ex, HttpServletRequest request) {
        return apiError(HttpStatus.BAD_REQUEST,ex.getCode(),ex.getMessage(),request,List.of());
    }
//    404
    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNotFoundException(NotFoundException ex, HttpServletRequest request) {
        return apiError(HttpStatus.NOT_FOUND,ex.getCode(),ex.getMessage(),request,List.of());
    }
//    403
    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiError handleForbiddenException(ForbiddenException ex, HttpServletRequest request) {
        return apiError(HttpStatus.FORBIDDEN,ex.getCode(),ex.getMessage(),request,List.of());
    }
//    409
    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiError handleConflict(ConflictException ex, HttpServletRequest request) {
        return apiError(HttpStatus.CONFLICT,ex.getCode(),ex.getMessage(),request,List.of());
    }
//    409 - DB constraint violation(unique constraints etc)
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiError handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        return apiError(
                HttpStatus.CONFLICT,
                "DATA_INTEGRITY_VIOLATION",
                "Your request conflicts with existing data(duplicate or constraint violation).",
                request,
                List.of()
        );
    }
//    500 - Internal Server Error
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError handleException(Exception ex, HttpServletRequest request) {
        return apiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "UNEXPECTED_ERROR",
                "Something went wrong. Please try again",
                request,
                List.of()
        );
    }
    private ApiError apiError(HttpStatus status,String code ,String message,HttpServletRequest request,List<ApiError.FieldIssue> details) {
        return new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                requestId(request),
                details
        );
    }
    private ApiError.FieldIssue toIssue(FieldError fieldError) {
        return new ApiError.FieldIssue(fieldError.getField(), fieldError.getDefaultMessage());
    }
    private String requestId(HttpServletRequest req) {
        String rid = req.getHeader("X-Request-Id");
        return (rid == null || rid.isBlank()) ? UUID.randomUUID().toString() : rid;
    }
}
