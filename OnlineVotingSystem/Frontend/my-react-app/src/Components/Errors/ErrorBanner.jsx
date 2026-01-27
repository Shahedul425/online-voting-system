import React from "react";

export function ErrorBanner({
                                error,
                                onClose,
                                className = "",
                                showRequestId = true,
                            }) {
    if (!error) return null;

    return (
        <div
            role="alert"
            className={[
                "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100",
                className,
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-semibold">
                        {error.title}
                        {error.status ? (
                            <span className="ml-2 text-xs font-medium text-red-200/70">
                ({error.status})
              </span>
                        ) : null}
                    </div>

                    <div className="mt-1 text-sm text-red-100/90 break-words">
                        {error.message}
                    </div>

                    {showRequestId && error.requestId ? (
                        <div className="mt-2 text-xs text-red-200/70">
                            Reference ID: <span className="font-mono">{error.requestId}</span>
                        </div>
                    ) : null}
                </div>

                {onClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-100/80 hover:text-red-100 hover:bg-white/10 transition"
                        aria-label="Dismiss error"
                    >
                        Close
                    </button>
                ) : null}
            </div>
        </div>
    );
}
