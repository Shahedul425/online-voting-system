import React from "react";

export function InlineFieldError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-300">{message}</p>;
}
