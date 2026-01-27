// Frontend canonical error model (works everywhere)
export function toAppError(input) {
    // Already normalized
    if (input?.__type === "AppError") return input;

    // From your apiRequest: { ok:false, error:{...} }
    const err = input?.error ?? input;

    const status = err?.status;
    const code = err?.code || "UNKNOWN";
    const requestId = err?.requestId;
    const path = err?.path;

    // Backend details: [{ field, message }]
    const details = Array.isArray(err?.details) ? err.details : [];
    const fieldErrors = detailsToFieldErrors(details);

    const message = pickBestMessage({ status, code, message: err?.message });

    return {
        __type: "AppError",
        title: titleFromStatus(status),
        message,
        status,
        code,
        requestId,
        path,
        details,
        fieldErrors, // { email: "...", password: "..." }
        severity: severityFromStatus(status),
        recoverable: status === 0 || (status >= 500 && status <= 599),
        raw: input,
    };
}

function detailsToFieldErrors(details) {
    // if same field appears multiple times, join nicely
    return details.reduce((acc, d) => {
        const field = d?.field;
        const msg = d?.message;
        if (!field || !msg) return acc;
        acc[field] = acc[field] ? `${acc[field]} ${msg}` : msg;
        return acc;
    }, {});
}

function titleFromStatus(status) {
    if (status === 400) return "Check your input";
    if (status === 401) return "Sign in required";
    if (status === 403) return "Access denied";
    if (status === 404) return "Not found";
    if (status === 409) return "Conflict";
    if (status === 0) return "Network issue";
    if (status >= 500) return "Server problem";
    return "Something went wrong";
}

function severityFromStatus(status) {
    if (status === 0) return "warning";
    if (status >= 500) return "error";
    if (status >= 400) return "warning";
    return "info";
}

function pickBestMessage({ status, code, message }) {
    // Keep your backend message when it’s safe + helpful.
    // Overwrite only for a few common auth/network cases.
    if (status === 0) return "We couldn’t reach the server. Check your connection and try again.";
    if (status === 401) return "Incorrect email or password.";
    if (status === 403) return "You don’t have permission to perform this action.";
    if (status === 409 && code === "DATA_INTEGRITY_VIOLATION")
        return "That conflicts with existing data. Please review and try again.";
    return message || "Please try again.";
}
