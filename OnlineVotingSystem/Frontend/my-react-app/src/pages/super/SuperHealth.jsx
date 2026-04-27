/*
 * SuperHealth — Observability jump-off.
 *
 *   Grafana is the "front door"; Prometheus / Loki / Tempo / Alloy are the raw
 *   data sources behind it. Each one gets a clickable card with the URL so an
 *   operator can open any source directly. URLs come from Vite env vars with
 *   sensible localhost defaults, so the exact same bundle works in dev and
 *   behind a reverse proxy in prod (just override with VITE_*_URL).
 *
 *   Forensic-trace widget unchanged at the bottom — it builds a LogQL-prefiltered
 *   Grafana Explore URL for a request ID.
 */
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import Icon from "../../ui/Icon";

const GRAFANA_URL    = import.meta.env.VITE_GRAFANA_URL    || "http://localhost:3000";
const PROMETHEUS_URL = import.meta.env.VITE_PROMETHEUS_URL || "http://localhost:9090";
const LOKI_URL       = import.meta.env.VITE_LOKI_URL       || "http://localhost:3100";
const TEMPO_URL      = import.meta.env.VITE_TEMPO_URL      || "http://localhost:3200";
const ALLOY_URL      = import.meta.env.VITE_ALLOY_URL      || "http://localhost:12345";

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

export default function SuperHealth() {
  return (
    <AppShell role="superadmin" active="/superadmin/health">
      <Topbar
        title="Observability"
        crumbs={[
          { label: "Overview", path: "/superadmin/dashboard" },
          { label: "Observability" },
        ]}
      />
      <Scaffold>
        <div className="max-w-5xl mx-auto">
          {/* Intro */}
          <div className="card p-6 mb-5 flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--grad-soft)", color: "var(--coral)" }}
            >
              <Icon name="activity" className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div
                className="display text-xl font-semibold mb-1"
                style={{ color: "var(--t1)" }}
              >
                Service health lives in Grafana
              </div>
              <p
                className="text-sm max-w-2xl"
                style={{ color: "var(--t2)" }}
              >
                Uptime, p95, error rate, RPS, logs, traces, alerts — all wired
                into Grafana. Individual data sources are linked below in case
                you need to poke at raw metrics or run an ad-hoc LogQL query.
              </p>
            </div>
          </div>

          {/* Grafana primary CTA */}
          <a
            href={GRAFANA_URL}
            target="_blank"
            rel="noreferrer"
            className="card p-6 card-hover block mb-5"
          >
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lift"
                style={{ background: "var(--grad-primary)" }}
              >
                <Icon name="gauge" className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div
                    className="display text-xl font-semibold"
                    style={{ color: "var(--t1)" }}
                  >
                    Open Grafana dashboard
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(139,130,239,0.16)",
                      color: "var(--purple)",
                    }}
                  >
                    primary
                  </span>
                </div>
                <p
                  className="text-sm max-w-2xl"
                  style={{ color: "var(--t2)" }}
                >
                  All four data sources — Prometheus, Loki, Tempo,
                  Alertmanager — are pre-wired inside Grafana's navigation.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-[11px] mono" style={{ color: "var(--t3)" }}>
                  {["service-health", "alerts", "logs", "traces"].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded"
                      style={{ background: "var(--surface-2)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-3 text-[11px] mono"
                  style={{ color: "var(--t3)" }}
                >
                  {GRAFANA_URL}
                </div>
              </div>
              <div
                className="shrink-0 flex items-center gap-2 font-semibold"
                style={{ color: "var(--purple)" }}
              >
                Open <Icon name="external-link" className="w-5 h-5" />
              </div>
            </div>
          </a>

          {/* Raw data-source cards */}
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--t3)" }}
          >
            Raw data sources
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {DATA_SOURCES.map((ds) => (
              <a
                key={ds.key}
                href={ds.url}
                target="_blank"
                rel="noreferrer"
                className="card p-4 card-hover flex items-start gap-3"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
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
                  <div
                    className="text-xs"
                    style={{ color: "var(--t2)" }}
                  >
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
            className="card p-6"
            style={{
              background: "var(--grad-navy)",
              color: "#fff",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Icon name="search" className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="display text-lg font-semibold mb-1">
                  Forensic investigation
                </div>
                <p className="text-sm mb-4 max-w-xl" style={{ color: "rgba(255,255,255,0.72)" }}>
                  Paste a request ID — we template the Loki LogQL query and
                  open it pre-filtered in Grafana Explore.
                </p>
                <ForensicForm grafanaUrl={GRAFANA_URL} />
              </div>
            </div>
          </div>

          {/* Hint about env overrides */}
          <div
            className="mt-4 text-[11px]"
            style={{ color: "var(--t3)" }}
          >
            URLs are configured via <span className="mono">VITE_GRAFANA_URL</span>,{" "}
            <span className="mono">VITE_PROMETHEUS_URL</span>,{" "}
            <span className="mono">VITE_LOKI_URL</span>,{" "}
            <span className="mono">VITE_TEMPO_URL</span>, and{" "}
            <span className="mono">VITE_ALLOY_URL</span>. Defaults assume the
            Docker Compose stack on localhost.
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
    window.open(
      `${grafanaUrl}/explore?left={"queries":[{"expr":"${q}"}]}`,
      "_blank"
    );
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        name="requestId"
        placeholder="req_a1b2c3d4e5f6…"
        className="flex-1 min-w-[260px] px-4 py-2.5 rounded-xl mono text-sm"
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
