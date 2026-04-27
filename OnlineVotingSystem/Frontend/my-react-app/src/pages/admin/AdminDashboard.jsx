/*
 * AdminDashboard
 *
 * Endpoints:
 *   OVS.getAllElections({ orgId })
 *
 * The status KPIs are clickable: each one routes to /admin/elections?status=<k>
 * so the admin can drill straight into the filtered list.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { useAppStore } from "../../Service/GlobalState/appStore";

export default function AdminDashboard() {
  const me = useAppStore(s => s.me);
  const [elections, setElections] = useState([]);

  useEffect(() => {
    if (!me?.organizationId) return;
    withUnwrap(OVS.getAllElections({ orgId: me.organizationId }))
      .then(d => setElections(Array.isArray(d) ? d : []))
      .catch(() => setElections([]));
  }, [me]);

  const byStatus = elections.reduce((a, e) => {
    const k = (e.status || "").toLowerCase();
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});

  return (
    <AppShell role="admin" active="/admin/dashboard">
      <Topbar
        title="Dashboard"
        right={
          <Link to="/admin/elections/create" className="btn btn-primary">
            <Icon name="plus" className="w-4 h-4" />New election
          </Link>
        }
      />
      <Scaffold>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Kpi icon="play"   label="Running"   value={byStatus.running   || 0} status="running"   />
          <Kpi icon="pencil" label="Drafts"    value={byStatus.draft     || 0} status="draft"     />
          <Kpi icon="lock"   label="Closed"    value={byStatus.closed    || 0} status="closed"    />
          <Kpi icon="trophy" label="Published" value={byStatus.published || 0} status="published" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="display text-lg font-semibold">Recent elections</div>
          <Link to="/admin/elections" className="text-sm coral font-semibold">View all →</Link>
        </div>

        {elections.length === 0
          ? (
            <div className="card p-8 text-center">
              <div className="ink-2 mb-2">No elections yet.</div>
              <Link to="/admin/elections/create" className="btn btn-primary">
                <Icon name="plus" className="w-4 h-4" />Create one
              </Link>
            </div>
          )
          : (
            <div className="space-y-2">
              {elections.slice(0, 6).map(e => (
                <Link
                  key={e.id}
                  to={`/admin/elections/${e.id}`}
                  className="card card-hover p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center">
                    <Icon name="vote" className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{e.name}</div>
                      <StatusPill status={e.status} />
                    </div>
                    <div className="text-xs ink-3">
                      {e.votedCount || 0} of {e.totalVoters || 0} ballots cast
                    </div>
                  </div>
                  <Icon name="chevron-right" className="w-4 h-4 ink-3" />
                </Link>
              ))}
            </div>
          )
        }
      </Scaffold>
    </AppShell>
  );
}

function Kpi({ icon, label, value, status }) {
  return (
    <Link
      to={`/admin/elections?status=${encodeURIComponent(status)}`}
      className="card card-hover p-5 block group"
      aria-label={`Show ${label.toLowerCase()} elections`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center">
          <Icon name={icon} className="w-5 h-5" />
        </div>
        <div className="text-xs ink-3 uppercase tracking-widest">{label}</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="display text-3xl font-semibold">{value}</div>
        <span
          className="text-[11px] ink-3 inline-flex items-center gap-0.5 transition-opacity opacity-60 group-hover:opacity-100"
        >
          View <Icon name="arrow-right" className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
