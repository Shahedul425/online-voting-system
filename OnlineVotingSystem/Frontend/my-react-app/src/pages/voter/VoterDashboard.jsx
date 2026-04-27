/*
 * Endpoints used:
 *   OVS.getVoterAllActiveElections({ orgId })  — GET /voter/election/ActiveElections/{orgId}
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { EmptyState, Btn } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { useAppStore } from "../../Service/GlobalState/appStore";

export default function VoterDashboard() {
  const me = useAppStore(s => s.me);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me?.organizationId) return;
    withUnwrap(OVS.getVoterAllActiveElections({ orgId: me.organizationId }))
      .then(d => setElections(d || []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, [me]);

  const running = elections.filter(e => e.status === "running");
  const upcoming = elections.filter(e => e.status === "draft" || e.status === "scheduled");

  return (
    <AppShell role="voter" active="/voter/dashboard">
      <Topbar
        title={`Welcome, ${(me?.email || "").split("@")[0]}`}
        crumbs={[{ label: "Home" }]}
      />
      <Scaffold>
        {/* Hero — a running election gets the spotlight */}
        {running.length > 0 && (
          <div className="card p-6 mb-6 shadow-lift grad-primary text-white overflow-hidden" style={{ position: "relative" }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 85% 0%, rgba(255,255,255,0.3) 0%, transparent 40%)" }} />
            <div className="relative flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Icon name="vote" className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="text-xs opacity-80 uppercase tracking-widest mb-1">Voting is open</div>
                <div className="display text-3xl font-bold mb-1">{running[0].name}</div>
                <div className="text-sm opacity-90 mb-4">Closes {running[0].endTime ? new Date(running[0].endTime).toUTCString() : "soon"}.</div>
                <Link to={`/voter/ballot/${running[0].id}`} className="btn" style={{ background: "white", color: "var(--coral)", fontWeight: 600 }}>
                  <Icon name="vote" className="w-4 h-4" /> Cast my ballot
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Cards row */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <StatCard icon="vote"           label="Active elections"   value={running.length} />
          <StatCard icon="calendar"       label="Upcoming"           value={upcoming.length} />
          <StatCard icon="shield-check"   label="Receipts stored"    value="0" hint="Stored in this session only" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="display text-lg font-semibold">Your elections</div>
          <Link to="/voter/elections" className="text-sm coral font-semibold">View all →</Link>
        </div>

        {loading ? <div className="ink-3 text-sm">Loading…</div> :
         elections.length === 0 ? <EmptyState icon="inbox" title="No elections yet" body="You'll see them here when your organisation schedules one." /> :
         <div className="grid md:grid-cols-2 gap-3">
           {elections.slice(0, 4).map(e => <ElectionCard key={e.id} e={e} />)}
         </div>
        }
      </Scaffold>
    </AppShell>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center">
          <Icon name={icon} className="w-5 h-5" />
        </div>
        <div className="text-xs ink-3 uppercase tracking-widest">{label}</div>
      </div>
      <div className="display text-3xl font-semibold">{value}</div>
      {hint && <div className="text-xs ink-3 mt-1">{hint}</div>}
    </div>
  );
}

function ElectionCard({ e }) {
  return (
    <Link to={`/voter/election/${e.id}`} className="card card-hover p-5 block">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center shrink-0">
          <Icon name="vote" className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{e.name}</div>
          <div className="text-xs ink-3">{e.orgName || "—"}</div>
        </div>
      </div>
      <div className="text-xs ink-2">{e.status}</div>
    </Link>
  );
}
