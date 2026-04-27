/*
 * VoterNotifications.jsx
 * ---------------------------------------------------------------------------
 * There is no `/voter/notifications` endpoint in OVS yet — notifications are
 * synthesised client-side by looking at the voter's active elections:
 *   • an election that just opened  → "Voting is open — cast your ballot"
 *   • an election that just closed  → "Results will be published soon"
 *   • an election in `published`    → "Results are live — view or verify"
 * When the backend gains a real /voter/notifications endpoint, swap the
 * `useEffect` hook to call `OVS.getVoterNotifications` — the render code is
 * already generic over the { id, kind, title, body, when, ctaPath } shape.
 * ---------------------------------------------------------------------------
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { EmptyState } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { relTime } from "../../lib/format";

export default function VoterNotifications() {
  const me = useAppStore(s => s.me);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me?.organizationId) return;
    setLoading(true);
    withUnwrap(OVS.getVoterAllActiveElections({ orgId: me.organizationId }))
      .then(list => {
        const now = new Date();
        const synth = [];
        (list || []).forEach(e => {
          if (e.status === "running") {
            synth.push({
              id: `run-${e.id}`, kind: "action", icon: "vote",
              title: `${e.name} — voting is open`,
              body: "Cast your ballot before the deadline.",
              when: e.startTime || e.createdAt,
              ctaPath: `/voter/ballot/${e.id}`, ctaLabel: "Vote now",
            });
          } else if (e.status === "closed") {
            synth.push({
              id: `close-${e.id}`, kind: "info", icon: "lock",
              title: `${e.name} — voting has closed`,
              body: "Results will appear here once the admin publishes them.",
              when: e.endTime || e.createdAt,
            });
          } else if (e.status === "published") {
            synth.push({
              id: `pub-${e.id}`, kind: "success", icon: "trophy",
              title: `${e.name} — results published`,
              body: "View the outcome or re-verify your receipt on the Merkle root.",
              when: e.publishedAt || e.endTime,
              ctaPath: `/voter/results/${e.id}`, ctaLabel: "View results",
            });
          }
        });
        synth.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
        setItems(synth);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [me]);

  return (
    <AppShell role="voter" active="/voter/notifications">
      <Topbar title="Notifications" crumbs={[{label:"Home",path:"/voter/dashboard"},{label:"Notifications"}]} />
      <Scaffold>
        <div className="max-w-3xl mx-auto">
          <div className="card p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center"><Icon name="bell" className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-semibold">Everything that needs your attention</div>
              <div className="text-xs ink-3">Synthesised from your active elections. {items.length} item{items.length===1?"":"s"}.</div>
            </div>
          </div>

          {loading
            ? <div className="card p-8 text-center ink-3 text-sm">Loading…</div>
            : items.length === 0
              ? <EmptyState icon="inbox" title="You're all caught up" body="No elections need your attention right now." />
              : <div className="space-y-2">
                  {items.map(n => (
                    <div key={n.id} className="card p-4 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.kind==="action"?"grad-primary text-white":n.kind==="success"?"grad-soft coral":"surface-2"}`}>
                        <Icon name={n.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold truncate">{n.title}</div>
                          <span className="text-[11px] mono ink-3">{relTime(n.when)}</span>
                        </div>
                        <div className="text-sm ink-2 mt-1">{n.body}</div>
                        {n.ctaPath && (
                          <Link to={n.ctaPath} className="inline-flex items-center gap-1 text-sm coral font-semibold mt-2">
                            {n.ctaLabel} <Icon name="arrow-right" className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>
      </Scaffold>
    </AppShell>
  );
}
