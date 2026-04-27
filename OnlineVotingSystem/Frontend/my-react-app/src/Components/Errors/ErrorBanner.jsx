import React from "react";
import Icon from "../../ui/Icon";

/**
 * ErrorBanner — renders an ApiError (see GlobalApiHandler.js) in a themed card.
 *
 * Accepts any of:
 *   - { message, status?, code?, requestId?, details?, fieldErrors? }  ← canonical
 *   - { title, message, ... }  ← legacy shape (title becomes the heading)
 *   - plain string
 *
 * Field-level validation errors (backend's `details: [{field, message, issue}]`
 * array) are rendered inline below the main message so users see *why* a form
 * was rejected, not just "Validation failed".
 */
export function ErrorBanner({
  error,
  onClose,
  className = "",
  showRequestId = true,
}) {
  if (!error) return null;

  const err = typeof error === "string" ? { message: error } : error;
  const title   = err.title || headingFor(err);
  const status  = err.status;
  const code    = err.code;
  const rid     = err.requestId;
  const details = Array.isArray(err.details) ? err.details : [];
  const fieldErrors = err.fieldErrors && typeof err.fieldErrors === "object" ? err.fieldErrors : null;

  return (
    <div
      role="alert"
      className={`rounded-xl px-4 py-3 ${className}`}
      style={{
        background: "var(--red-d)",
        border: "1px solid rgba(239,133,133,0.32)",
        color: "var(--t1)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(239,133,133,0.18)", color: "var(--red)" }}
        >
          <Icon name="alert-triangle" className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <div className="font-semibold text-sm" style={{ color: "var(--t1)" }}>
              {title}
            </div>
            {status ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(239,133,133,0.16)", color: "var(--red)" }}>
                {status}
              </span>
            ) : null}
            {code && code !== "HTTP_ERROR" ? (
              <span className="text-[10px] mono" style={{ color: "var(--t3)" }}>
                {code}
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-xs break-words" style={{ color: "var(--t2)" }}>
            {err.message || "Something went wrong."}
          </div>

          {details.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs">
              {details.map((d, i) => (
                <li key={i} className="flex gap-2" style={{ color: "var(--t2)" }}>
                  <span className="mono shrink-0" style={{ color: "var(--red)" }}>
                    {d.field || "—"}:
                  </span>
                  <span>{d.message || d.issue}</span>
                </li>
              ))}
            </ul>
          )}

          {fieldErrors && Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs">
              {Object.entries(fieldErrors).map(([field, msg]) => (
                <li key={field} className="flex gap-2" style={{ color: "var(--t2)" }}>
                  <span className="mono shrink-0" style={{ color: "var(--red)" }}>{field}:</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          )}

          {showRequestId && rid ? (
            <div className="mt-2 text-[10px]" style={{ color: "var(--t3)" }}>
              Reference: <span className="mono">{rid}</span>
            </div>
          ) : null}
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss error"
            className="shrink-0 rounded-lg p-1 transition-opacity hover:opacity-80"
            style={{ color: "var(--t3)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function headingFor(err) {
  const code = String(err.code || "").toUpperCase();
  if (code === "VALIDATION_FAILED") return "Couldn't save this — please check the fields below";
  if (code === "UNAUTHORIZED" || err.status === 401) return "Your session has expired";
  if (code === "FORBIDDEN" || err.status === 403) return "You don't have access to this";
  if (code === "NOT_FOUND"  || err.status === 404) return "We couldn't find that";
  if (code === "NETWORK_ERROR") return "Couldn't reach the server";
  if (err.status >= 500) return "The server had a problem";
  return "Something went wrong";
}

export default ErrorBanner;
