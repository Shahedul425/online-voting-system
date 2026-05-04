/*
 * SuperHealth — Observability hub.
 *
 *   Grafana is the "front door"; Prometheus / Loki / Tempo / Alloy are the raw
 *   data sources behind it. This page surfaces a clickable card for each tool
 *   so the operator can hop straight into Grafana (and from there set up
 *   datasources / dashboards / PromQL manually).
 *
 *   URL strategy
 *   ------------
 *   - VITE_*_URL env override wins if explicitly set at build time.
 *   - In dev (vite dev server, import.meta.env.DEV) defaults are localhost
 *     pointing at the docker-compose stack's host ports.
 *   - In prod the defaults are the public trustvote.live subdomains, the
 *     same way Keycloak lives at https://auth.trustvote.live/auth — so the
 *     "Open Grafana" button takes the operator to the real Grafana login,
 *     never to localhost.
 */
import { useState } from "react";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import Icon from "../../ui/Icon";

// ── URL resolution ─────────────────────────────────────────────────────────
const isDev = import.meta.env.DEV;
const pick = (envValue, devDefault, prodDefault) =>
  (envValue && envValue.trim()) || (isDev ? devDefault : prodDefault);

// Dev: docker-compose host ports.  Prod: public trustvote.live subdomains.
// Override any of these via VITE_*_URL at build time if your topology differs.
const GRAFANA_URL    = pick(import.meta.env.VITE_GRAFANA_URL,    "http://localhost:3000",  "https://grafana.trustvote.live");
const PROMETHEUS_URL = pick(import.meta.env.VITE_PROMETHEUS_URL, "http://localhost:9090",  "https://grafana.trustvote.live");
const LOKI_URL       = pick(import.meta.env.VITE_LOKI_URL,       "http://localhost:3100",  "https://grafana.trustvote.live");
const TEMPO_URL      = pick(import.meta.env.VITE_TEMPO_URL,      "http://localhost:3200",  "https://grafana.trustvote.live");
const ALLOY_URL      = pick(import.meta.env.VITE_ALLOY_URL,      "http://localhost:12345", "https://grafana.trustvote.live");
const DEFAULT_DASH   = (import.meta.env.VITE_GRAFANA_DEFAULT_DASH || "").trim();

// Same-origin relative paths can be embedded; absolute cross-origin URLs
// usually can't due to X-Frame-Options.
const isEmbeddable = (url) => url.startsWith("/") || url.startsWith(window.location.origin);

const DATA_SOURCES = [
  {
    key: "prometheus",
    name: "Prometheus",
    url: PROMETHEUS_URL,
    blurb: "Time-series metrics — /actuator/prometheus scraped every 15s.",
    icon: "bar-chart-2",
    color: "var(--orange)",
    tint: "rgba(241,173,92,0.14)",
  },
  {
    key: "loki",
    name: "Loki",
    url: LOKI_URL,
    blurb: "Log aggregation — application + audit stream, queryable via LogQL.",
    icon: "file-text",
    color: "var(--green)",
    tint: "rgba(91,207,146,0.14)",
  },
  {
    key: "tempo",
    name: "Tempo",
    url: TEMPO_URL,
    blurb: "Distributed traces — OpenTelemetry OTLP ingest on :4318.",
    icon: "git-branch",
    color: "var(--purple)",
    tint: "rgba(139,130,239,0.14)",
  },
  {
    key: "alloy",
    name: "Alloy",
    url: ALLOY_URL,
    blurb: "Agent collecting metrics, logs, and traces; forwards to the trio above.",
    icon: "zap",
    color: "var(--cyan)",
    tint: "rgba(107,217,227,0.14)",
  },
];

// Quick-jump shortcuts inside Grafana — built relative to GRAFANA_URL.
const grafanaPath = (p) => `${GRAFANA_URL.replace(/\/$/, "")}${p}`;
const QUICK_JUMPS = [
  { key: "explore",    label: "Explore",     icon: "compass",     path: "/explore",       tint: "var(--purple)" },
  { key: "dashboards", label: "Dashboards",  icon: "layout-grid", path: "/dashboards",    tint: "var(--cyan)"   },
  { key: "alerting",   label: "Alerts",      icon: "bell",        path: "/alerting/list", tint: "var(--orange)" },
  { key: "logs",       label: "Logs (Loki)", icon: "file-text",   path: "/explore?left=" + encodeURIComponent('{"datasource":"loki"}'),  tint: "var(--green)"  },
  { key: "traces",     label: "Traces",      icon: "git-branch",  path: "/explore?left=" + encodeURIComponent('{"datasource":"tempo"}'), tint: "var(--purple)" },
];

export default function SuperHealth() {
  const [embedOpen, setEmbedOpen] = useState(true);
  const [embedTab, setEmbedTab]   = useState("grafana");

  const TAB_TO_URL = {
    grafana: DEFAULT_DASH ? grafanaPath(`/d/${DEFAULT_DASH}?kiosk=tv&theme=dark`) : grafanaPath("/?kiosk=tv&theme=dark"),
    prometheus: PROMETHEUS_URL,
    loki: LOKI_URL,
    tempo: TEMPO_URL,
    alloy: ALLOY_URL,
  };
  const TAB_TO_OPEN = {
    grafana: GRAFANA_URL,
    prometheus: PROMETHEUS_URL,
    loki: LOKI_URL,
    tempo: TEMPO_URL,
    alloy: ALLOY_URL,
  };
  const embedSrc = TAB_TO_URL[embedTab];
  const canEmbed = isEmbeddable(embedSrc);

  return (
    <AppShell role="superadmin" active="/superadmin/health">
      <Topbar
        title="Observability"
        crumbs={[
          { label: "Overview", path: "/superadmin/dashboard" },
          { label: "Observability" },
        ]}
        right={
          <div className="hidden sm:flex items-center gap-2">
            <a
              href={GRAFANA_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ minHeight: 36 }}
              title="Open Grafana in a new tab"
            >
              <Icon name="external-link" className="w-4 h-4" /> Open Grafana
            </a>
          </div>
        }
      />
      <Scaffold>
        <div className="max-w-7xl mx-auto w-full">
          {/* Intro */}
          <div className="card p-4 sm:p-6 mb-4 sm:mb-5 flex items-start gap-3 sm:gap-4">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--grad-soft)", color: "var(--coral)" }}
            >
              <Icon name="activity" className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="display text-lg sm:text-xl font-semibold mb-1"
                style={{ color: "var(--t1)" }}
              >
                Service health lives in Grafana
              </div>
              <p
                className="text-xs sm:text-sm max-w-2xl"
                style={{ color: "var(--t2)" }}
              >
                Uptime, p95, error rate, RPS, logs, traces, alerts — all wired
                into Grafana. Individual data sources are linked below in case
                you need to poke at raw metrics or run an ad-hoc LogQL query.
              </p>
            </div>
          </div>

          {/* Embedded viewer */}
          <div
            className="card overflow-hidden mb-4 sm:mb-5"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center gap-1 px-2 sm:px-3 py-2 overflow-x-auto"
              style={{
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {[
                { k: "grafana",    label: "Grafana",    icon: "gauge" },
                { k: "prometheus", label: "Prometheus", icon: "bar-chart-2" },
                { k: "loki",       label: "Loki",       icon: "file-text" },
                { k: "tempo",      label: "Tempo",      icon: "git-branch" },
                { k: "alloy",      label: "Alloy",      icon: "zap" },
              ].map((t) => {
                const active = embedTab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setEmbedTab(t.k)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors"
                    style={{
                      color: active ? "var(--t1)" : "var(--t2)",
                      background: active ? "var(--surface-2)" : "transparent",
                      border: `1px solid ${active ? "var(--border-h)" : "transparent"}`,
                    }}
                  >
                    <Icon name={t.icon} className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-1">
                <a
                  href={TAB_TO_OPEN[embedTab]}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                  style={{ minHeight: 32, padding: "4px 10px", fontSize: 12 }}
                  title="Open in new tab"
                >
                  <Icon name="external-link" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pop out</span>
                </a>
                <button
                  onClick={() => setEmbedOpen((v) => !v)}
                  className="btn btn-ghost"
                  style={{ minHeight: 32, padding: "4px 10px", fontSize: 12 }}
                  title={embedOpen ? "Collapse viewer" : "Expand viewer"}
                >
                  <Icon name={embedOpen ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {embedOpen && (
              <div
                className="relative w-full"
                style={{
                  background: "var(--bg)",
                  height: "clamp(380px, 65vh, 820px)",
                }}
              >
                {canEmbed ? (
                  <iframe
                    key={embedSrc}
                    src={embedSrc}
                    title={`${embedTab} viewer`}
                    className="w-full h-full"
                    style={{ border: 0, background: "var(--bg)" }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div
                      className="card p-5 max-w-md text-center"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <Icon
                        name="external-link"
                        className="w-7 h-7 mx-auto mb-2"
                        style={{ color: "var(--t2)" }}
                      />
                      <div className="font-semibold mb-1" style={{ color: "var(--t1)" }}>
                        Cross-origin — open in new tab
                      </div>
                      <p className="text-xs mb-3" style={{ color: "var(--t2)" }}>
                        This URL is on a different origin so the browser
                        blocks framing. Click below to open it directly.
                      </p>
                      <a
                        href={TAB_TO_OPEN[embedTab]}
                        target="_blank"
                        rel="noreferrer"
                        className="btn"
                        style={{ background: "var(--grad-primary)", color: "white" }}
                      >
                        <Icon name="external-link" className="w-4 h-4" />
                        Open {embedTab}
                      </a>
                      <div className="mt-3 text-[11px] mono" style={{ color: "var(--t3)" }}>
                        {TAB_TO_OPEN[embedTab]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grafana quick jumps */}
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--t3)" }}
          >
            Grafana quick jumps
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-5">
            {QUICK_JUMPS.map((q) => (
              <a
                key={q.key}
                href={grafanaPath(q.path)}
                target="_blank"
                rel="noreferrer"
                className="card card-hover p-3 flex items-center gap-2.5"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--surface-2)", color: q.tint }}
                >
                  <Icon name={q.icon} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="font-semibold text-xs sm:text-sm truncate"
                    style={{ color: "var(--t1)" }}
                  >
                    {q.label}
                  </div>
                  <div className="text-[10px] mono truncate" style={{ color: "var(--t3)" }}>
                    {q.path}
                  </div>
                </div>
                <Icon name="arrow-right" className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--t3)" }} />
              </a>
            ))}
          </div>

          {/* Raw data-source cards */}
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--t3)" }}
          >
            Raw data sources
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            {DATA_SOURCES.map((ds) => (
              <a
                key={ds.key}
                href={ds.url}
                target="_blank"
                rel="noreferrer"
                className="card p-3 sm:p-4 card-hover flex items-start gap-3"
              >
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: ds.tint, color: ds.color }}
                >
                  <Icon name={ds.icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "var(--t1)" }}
                    >
                      {ds.name}
                    </div>
                    <Icon
                      name="external-link"
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--t3)" }}
                    />
                  </div>
                  <div className="text-xs" style={{ color: "var(--t2)" }}>
                    {ds.blurb}
                  </div>
                  <div
                    className="mt-1 text-[11px] mono truncate"
                    style={{ color: "var(--t3)" }}
                  >
                    {ds.url}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Forensic trace widget */}
          <div
            className="card p-4 sm:p-6"
            style={{
              background: "var(--grad-navy)",
              color: "#fff",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Icon name="search" className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="display text-base sm:text-lg font-semibold mb-1">
                  Forensic investigation
                </div>
                <p
                  className="text-xs sm:text-sm mb-3 sm:mb-4 max-w-xl"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  Paste a request ID — we template the Loki LogQL query and
                  open it pre-filtered in Grafana Explore.
                </p>
                <ForensicForm grafanaUrl={GRAFANA_URL} />
              </div>
            </div>
          </div>

          {/* Hint about env overrides */}
          <div className="mt-4 text-[11px]" style={{ color: "var(--t3)" }}>
            URLs are configurable via <span className="mono">VITE_GRAFANA_URL</span>,{" "}
            <span className="mono">VITE_PROMETHEUS_URL</span>,{" "}
            <span className="mono">VITE_LOKI_URL</span>,{" "}
            <span className="mono">VITE_TEMPO_URL</span>, and{" "}
            <span className="mono">VITE_ALLOY_URL</span>. Defaults: docker-compose
            host ports in dev, <span className="mono">https://grafana.trustvote.live</span>{" "}
            in prod (mirroring the <span className="mono">https://auth.trustvote.live/auth</span>{" "}
            pattern used for Keycloak).
          </div>
        </div>
      </Scaffold>
    </AppShell>
  );
}

function ForensicForm({ grafanaUrl }) {
  const submit = (e) => {
    e.preventDefault();
    const rid = (new FormData(e.target).get("requestId") || "")
      .toString()
      .trim();
    if (!rid) return;
    const q = encodeURIComponent(
      `{job="voting-backend"} | json | requestId="${rid}"`
    );
    const base = grafanaUrl.replace(/\/$/, "");
    window.open(
      `${base}/explore?left={"queries":[{"expr":"${q}"}]}`,
      "_blank"
    );
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        name="requestId"
        placeholder="req_a1b2c3d4e5f6…"
        className="flex-1 min-w-0 sm:min-w-[260px] px-3 sm:px-4 py-2.5 rounded-xl mono text-xs sm:text-sm"
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      />
      <button
        className="btn"
        style={{
          background: "white",
          color: "var(--navy)",
          fontWeight: 600,
        }}
      >
        <Icon name="search" className="w-4 h-4" /> Trace this ID
      </button>
    </form>
  );
}
