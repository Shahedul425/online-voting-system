package com.example.demo.GlobalExceptionHandler;

import com.example.demo.Exception.*;
import com.example.demo.Records.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ========= 400 =========

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleValid(MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<ApiError.FieldIssue> issues = ex.getBindingResult().getFieldErrors().stream()
                .map(this::toIssue)
                .toList();

        String msg = "Validation failed: " + issues.stream()
                .limit(8)
                .map(i -> i.field() + " (" + i.issue() + "): " + i.message())
                .reduce((a, b) -> a + ", " + b)
                .orElse("invalid fields");

        logProblem(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "Request validation failed (invalid fields)", msg, ex, false);

        return apiError(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", msg, request, issues);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleConstraint(ConstraintViolationException ex, HttpServletRequest request) {

        List<ApiError.FieldIssue> issues = ex.getConstraintViolations().stream()
                .map(this::toIssue)
                .toList();

        String msg = "Validation failed: " + issues.stream()
                .limit(8)
                .map(i -> i.field() + " (" + i.issue() + "): " + i.message())
                .reduce((a, b) -> a + ", " + b)
                .orElse(ex.getMessage());

        logProblem(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "Request validation failed (constraint violation)", msg, ex, false);

        return apiError(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", msg, request, issues);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {

        String actual = (ex.getMostSpecificCause() != null)
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        String msg = "Malformed request body: " + actual;

        logProblem(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
                "Request body is malformed/unreadable", msg, ex, false);

        return apiError(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", msg, request, List.of());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        String expected = (ex.getRequiredType() != null) ? ex.getRequiredType().getSimpleName() : "unknown";
        String msg = "Invalid value for '" + ex.getName() + "': '" + ex.getValue() + "' (expected " + expected + ")";

        logProblem(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH",
                "Parameter/path variable has wrong type/format", msg, ex, false);

        return apiError(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH", msg, request, List.of());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest request) {

        String msg = "Missing required parameter: " + ex.getParameterName();

        logProblem(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER",
                "Required parameter missing", msg, ex, false);

        return apiError(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER", msg, request, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ApiError handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {

        String msg = "Method not allowed: " + ex.getMethod();

        logProblem(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED",
                "HTTP method not allowed for this endpoint", msg, ex, false);

        return apiError(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", msg, request, List.of());
    }

    // ========= 401/403 =========

    @ExceptionHandler(UnAuthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiError handleUnauthorized(UnAuthorizedException ex, HttpServletRequest request) {

        logProblem(HttpStatus.UNAUTHORIZED, ex.getCode(),
                "Unauthorized (missing/invalid credentials)", ex.getMessage(), ex, false);

        return apiError(HttpStatus.UNAUTHORIZED, ex.getCode(), ex.getMessage(), request, List.of());
    }

    @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiError handleForbidden(Exception ex, HttpServletRequest request) {

        String code = (ex instanceof ForbiddenException fe) ? fe.getCode() : "FORBIDDEN";
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank()) ? ex.getMessage() : "Forbidden";

        logProblem(HttpStatus.FORBIDDEN, code, "Access forbidden", msg, ex, false);

        return apiError(HttpStatus.FORBIDDEN, code, msg, request, List.of());
    }

    // ========= 404 =========

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNotFound(NotFoundException ex, HttpServletRequest request) {

        logProblem(HttpStatus.NOT_FOUND, ex.getCode(),
                "Resource not found", ex.getMessage(), ex, false);

        return apiError(HttpStatus.NOT_FOUND, ex.getCode(), ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNoHandler(NoHandlerFoundException ex, HttpServletRequest request) {

        String msg = "No handler for " + ex.getHttpMethod() + " " + ex.getRequestURL();

        logProblem(HttpStatus.NOT_FOUND, "NO_HANDLER", "Endpoint not found", msg, ex, false);

        return apiError(HttpStatus.NOT_FOUND, "NO_HANDLER", msg, request, List.of());
    }

    // ========= 409 =========

    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiError handleConflict(ConflictException ex, HttpServletRequest request) {

        logProblem(HttpStatus.CONFLICT, ex.getCode(),
                "Conflict with current state/data", ex.getMessage(), ex, false);

        return apiError(HttpStatus.CONFLICT, ex.getCode(), ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiError handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {

        String actual = (ex.getMostSpecificCause() != null)
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        String msg = "Database constraint violation: " + actual;

        logProblem(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION",
                "Database constraint violation", msg, ex, false);

        return apiError(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", msg, request, List.of());
    }

    @ExceptionHandler(KeycloakEmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiError handleKeycloakEmailExists(KeycloakEmailAlreadyExistsException ex, HttpServletRequest request) {

        String code = "EMAIL_ALREADY_EXISTS";
        String reason = "User email already exists in identity provider";
        String msg = ex.getMessage();

        logProblem(HttpStatus.CONFLICT, code, reason, msg, ex, false);

        return apiError(HttpStatus.CONFLICT, code, msg, request, List.of());
    }

    // ========= ApiException fallback =========
    // If any ApiException subclass is thrown without a specific handler:
    @ExceptionHandler(ApiException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleApiExceptionFallback(ApiException ex, HttpServletRequest request) {

        String msg = ex.getMessage();

        logProblem(HttpStatus.BAD_REQUEST, ex.getCode(),
                "API exception (fallback mapped to BAD_REQUEST)", msg, ex, false);

        return apiError(HttpStatus.BAD_REQUEST, ex.getCode(), msg, request, List.of());
    }

    // ========= 500 =========

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError handleAny(Exception ex, HttpServletRequest request) {

        String msg = (ex.getMessage() != null) ? ex.getMessage() : ex.getClass().getSimpleName();

        // ✅ logs contain real root cause + stack trace
        logProblem(HttpStatus.INTERNAL_SERVER_ERROR, "UNEXPECTED_ERROR",
                "Unhandled server error", msg, ex, true);

        // ✅ API returns meaningful (you asked not "something went wrong")
        return apiError(HttpStatus.INTERNAL_SERVER_ERROR, "UNEXPECTED_ERROR", msg, request, List.of());
    }

    // ---------- helpers ----------

    private void logProblem(HttpStatus status,
                            String code,
                            String reason,
                            String msg,
                            Exception ex,
                            boolean includeStackTrace) {

        MDC.put("status", String.valueOf(status.value()));
        MDC.put("error_code", code);
        MDC.put("error_reason", reason);
        MDC.put("what_happened", "request_failed");
        MDC.put("exception_class", ex.getClass().getName());
        MDC.put("root_cause", rootCause(ex));


        if (includeStackTrace) {
            log.error("{}", msg, ex);
        } else {
            log.error("{}", msg);
        }
    }

    private ApiError apiError(HttpStatus status,
                              String code,
                              String message,
                              HttpServletRequest request,
                              List<ApiError.FieldIssue> details) {

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

    // ✅ 3 args (matches your ApiError.FieldIssue)
    private ApiError.FieldIssue toIssue(FieldError fieldError) {
        String field = fieldError.getField();
        String issue = fieldError.getCode(); // NotBlank, Size, Pattern...
        String message = fieldError.getDefaultMessage();
        return new ApiError.FieldIssue(field, issue, message);
    }

    private ApiError.FieldIssue toIssue(ConstraintViolation<?> v) {
        String field = (v.getPropertyPath() != null) ? v.getPropertyPath().toString() : "param";
        String issue = v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName();
        String message = v.getMessage();
        return new ApiError.FieldIssue(field, issue, message);
    }

    private String requestId(HttpServletRequest req) {
        String mdcRid = MDC.get("requestId");
        if (mdcRid != null && !mdcRid.isBlank()) return mdcRid;

        String headerRid = req.getHeader("X-Request-Id");
        if (headerRid != null && !headerRid.isBlank()) return headerRid;

        return java.util.UUID.randomUUID().toString();
    }
    private String rootCause(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        return (cur.getMessage() != null) ? cur.getMessage() : cur.getClass().getName();
    }

}
