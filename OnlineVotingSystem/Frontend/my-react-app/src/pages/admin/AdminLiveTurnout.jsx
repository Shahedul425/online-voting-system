/*
 * Live turnout + live audit feed. Updates in place (no re-mount).
 *
 * Endpoint (poll every 3s):
 *   OVS.liveAuditFeed({ electionId })  — NEEDS BACKEND WIRING, see BACKEND_CHANGES.md
 *   OVS.getElectionById({ id })         — used for the turnout gauge
 *
 * Fallback: if liveAuditFeed doesn't exist yet, this component only updates the
 * ballots-cast / turnout % values by re-polling getElectionById.
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime, relTime } from "../../lib/format";

const POLL_MS = 3000;
const FEED_CAP = 30;

export default function AdminLiveTurnout() {
  const { id } = useParams();
  const [el, setEl] = useState(null);
  const [feed, setFeed] = useState([]);
  const knownIds = useRef(new Set());

  // initial + polling
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [e, f] = await Promise.all([
          withUnwrap(OVS.getElectionById({ id })),
          OVS.liveAuditFeed
            ? withUnwrap(OVS.liveAuditFeed({ electionId: id })).catch(() => [])
            : Promise.resolve([]),
        ]);
        if (!alive) return;
        setEl(e);
        if (Array.isArray(f) && f.length) {
          const fresh = f.filter(a => !knownIds.current.has(a.id));
          if (fresh.length) {
            fresh.forEach(a => knownIds.current.add(a.id));
            setFeed(prev => [...fresh, ...prev].slice(0, FEED_CAP));
          }
        }
      } catch { /* noop */ }
    };
    tick();
    const iv = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(iv); };
  }, [id]);

  if (!el) return <AppShell role="admin" active="/admin/elections"><Scaffold><div className="ink-3 text-sm">Loading…</div></Scaffold></AppShell>;

  const pct = el.totalVoters ? Math.round((el.votedCount / el.totalVoters) * 1000) / 10 : 0;

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar title={`Live — ${el.name}`} crumbs={[{label:"Elections",path:"/admin/elections"},{label:el.name,path:`/admin/elections/${id}`},{label:"Live"}]} />
      <Scaffold>
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* Turnout gauge */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
              <div className="text-xs ink-3 uppercase tracking-widest">Live · polls every 3s</div>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <div className="display text-5xl font-bold tabular-nums">{pct}%</div>
              <div className="ink-2">
                <span className="tabular-nums font-semibold ink">{el.votedCount || 0}</span> of {el.totalVoters || 0} ballots cast
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden surface-2">
              <div className="grad-primary h-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Correlation ID / forensic box */}
          <div className="card p-5 grad-navy text-white">
            <div className="flex items-center gap-2 mb-3"><Icon name="search" className="w-4 h-4" /><div className="text-xs uppercase tracking-widest">Forensic tools</div></div>
            <div className="text-sm opacity-90 mb-3">Every action emits a requestId that crosses Loki, Tempo, Prometheus, and the audit table.</div>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="btn" style={{ background: "white", color: "var(--navy)", fontWeight: 600 }}>
              <Icon name="external-link" className="w-4 h-4" /> Open Grafana
            </a>
          </div>
        </div>

        {/* Live audit feed */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b hairline flex items-center gap-2">
            <Icon name="activity" className="w-4 h-4 coral" />
            <div className="font-semibold">Live audit feed</div>
            <div className="ml-auto text-xs ink-3">{feed.length} recent events</div>
          </div>
          <ul>
            {feed.length === 0 && <li className="p-6 text-center ink-3 text-sm">Watching for activity…</li>}
            {feed.map(a => (
              <li key={a.id} data-aud-id={a.id} className="px-5 py-3 border-b hairline flex items-center gap-3 fade-in text-sm">
                <span className="chip" style={{ background: "var(--surface-2)" }}>{a.action}</span>
                <span className="mono text-xs ink-3 truncate">{a.entityType}:{a.entityId}</span>
                <span className="ml-auto mono text-xs ink-3">{fmtDateTime(a.createdAt).slice(11, 19)} · {relTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Scaffold>
    </AppShell>
  );
}
