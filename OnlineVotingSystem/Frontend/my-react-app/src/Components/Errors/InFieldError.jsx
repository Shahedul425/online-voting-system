import React from "react";

/**
 * InlineFieldError — tiny inline-text error used directly beneath a form field.
 *
 * Uses CSS variables so it recolours correctly in both dark and light themes
 * (previously hard-coded to `text-red-300` which clashed with light mode).
 */
export function InlineFieldError({ message, id }) {
    if (!message) return null;
    return (
        <p
            id={id}
            role="alert"
            className="mt-1 text-xs"
            style={{ color: "var(--red)" }}
        >
            {message}
        </p>
    );
}

export default InlineFieldError;
