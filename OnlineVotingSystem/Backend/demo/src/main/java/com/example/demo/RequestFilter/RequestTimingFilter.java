package com.example.demo.RequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;
@Component
public class RequestTimingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestTimingFilter.class);

    private static final Set<String> SKIP_PREFIXES = Set.of(
            "/actuator", "/swagger", "/v3/api-docs", "/favicon.ico"
    );

    private static final long SLOW_THRESHOLD_MS = 1000;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        long startNs = System.nanoTime();

        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) requestId = UUID.randomUUID().toString();

        response.setHeader("X-Request-Id", requestId);

        String method = request.getMethod();
        String path = request.getRequestURI();
        String component = guessComponent(path);

        MDC.put("requestId", requestId);
        MDC.put("method", method);
        MDC.put("path", path);
        MDC.put("component", component);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNs) / 1_000_000;
            int status = response.getStatus();

            MDC.put("status", String.valueOf(status));
            MDC.put("duration_ms", String.valueOf(durationMs));

            // 🔴 FAILED REQUESTS
            if (status >= 500) {
                MDC.put("what_happened", "request_failed");
                MDC.put("error_reason", "server_error");
                log.error("request failed");
            }
            else if (status >= 400) {
                MDC.put("what_happened", "request_failed");
                MDC.put("error_reason", "client_error");
                log.warn("request failed");
            }

            // 🟠 SLOW SUCCESS REQUESTS
            else if (durationMs > SLOW_THRESHOLD_MS) {
                MDC.put("what_happened", "slow_request");
                MDC.put("error_reason", "duration_exceeded_threshold");
                log.warn("slow request threshold_ms={}", SLOW_THRESHOLD_MS);
            }

            // 🟢 NORMAL SUCCESS → NO LOG
            // handled by metrics + traces only

            MDC.clear();
        }
    }

    private String guessComponent(String uri) {
        if (uri.startsWith("/api/admin")) return "admin";
        if (uri.startsWith("/api/elections")) return "elections";
        if (uri.startsWith("/api/votes")) return "votes";
        if (uri.startsWith("/api/auth")) return "auth";
        return "core";
    }
}
