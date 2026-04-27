import React from "react";
import Icon from "../../ui/Icon";

/**
 * ErrorBoundary — global react-error catch-all.
 *
 * Purpose:
 *   - Prevents a single unhandled render error from crashing the whole app
 *     to a blank white screen.
 *   - Presents a themed, friendly fallback with a Reload / Go home CTA.
 *   - Logs the error to the browser console (dev) and emits a `window`
 *     CustomEvent("ovs:client-error") so any future telemetry shim can
 *     forward it to Tempo / Loki without coupling this file to the API.
 *
 * Usage (src/App.jsx):
 *   <ErrorBoundary>
 *     <Router>...</Router>
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Console for dev
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info?.componentStack);
    this.setState({ info });

    // Lightweight, decoupled hook for future telemetry / Sentry / OTel browser
    try {
      window.dispatchEvent(
        new CustomEvent("ovs:client-error", {
          detail: {
            message: error?.message,
            stack: error?.stack,
            componentStack: info?.componentStack,
            at: new Date().toISOString(),
            url: window.location.href,
          },
        })
      );
    } catch { /* no-op */ }
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--t1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          role="alert"
          style={{
            width: "100%",
            maxWidth: 560,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "28px 28px 24px",
            boxShadow: "0 16px 36px -14px rgba(0,0,0,0.22)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(239,133,133,0.16)",
                color: "var(--red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="alert-octagon" className="w-5 h-5" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "-0.012em",
                  marginBottom: 6,
                }}
              >
                Something went wrong on this page
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "var(--t2)",
                  margin: 0,
                }}
              >
                The page hit an unexpected error. You can try reloading, or head
                back to the home page. If this keeps happening, please share the
                details below with support.
              </p>

              {error?.message ? (
                <pre
                  style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                    fontFamily:
                      "'JetBrains Mono', ui-monospace, monospace",
                    color: "var(--t2)",
                    overflow: "auto",
                    maxHeight: 160,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {String(error.message)}
                </pre>
              ) : null}

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  <Icon name="refresh-cw" className="w-4 h-4" /> Reload page
                </button>
                <a href="/" className="btn btn-ghost">
                  <Icon name="home" className="w-4 h-4" /> Go home
                </a>
                <button
                  type="button"
                  onClick={this.reset}
                  className="btn btn-ghost"
                  title="Try to render again without reloading"
                >
                  <Icon name="rotate-ccw" className="w-4 h-4" /> Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
