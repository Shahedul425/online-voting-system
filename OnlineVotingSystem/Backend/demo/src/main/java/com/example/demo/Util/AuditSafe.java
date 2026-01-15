package com.example.demo.Util;

public final class AuditSafe {
    private AuditSafe() {}

    public static String safe(String s) {
        return s;
    }
}