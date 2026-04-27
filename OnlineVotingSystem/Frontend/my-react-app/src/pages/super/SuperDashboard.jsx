/*
 * Superadmin landing — orgs, total admins, total elections.
 *
 * Endpoints:
 *   OVS.getAllOrganizations() → List<OrganizationModel>
 *   OVS.getAllAdmins()        → List<AdminListItem> (every user with role=admin
 *                               on the platform, with their organizationId)
 *
 * Admin counts per org are computed on the client by grouping the admin list
 * by organizationId. We don't yet have a platform-wide election count
 * endpoint, so the elections KPI is left at "—" until that lands.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function SuperDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      withUnwrap(OVS.getAllOrganizations()),
      withUnwrap(OVS.getAllAdmins()),
    ]).then(([oResp, aResp]) => {
      if (cancelled) return;
      setOrgs(oResp.status === "fulfilled" && Array.isArray(oResp.value) ? oResp.value : []);
      setAdmins(aResp.status === "fulfilled" && Array.isArray(aResp.value) ? aResp.value : []);
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // adminsByOrg: { [orgId]: AdminListItem[] }
  const adminsByOrg = useMemo(() => {
    const m = {};
    for (const a of admins) {
      const k = a.organizationId;
      if (!k) continue;
      (m[k] ||= []).push(a);
    }
    return m;
  }, [admins]);

  return (
    <AppShell role="superadmin" active="/superadmin/dashboard">
      <Topbar title="Platform overview" crumbs={[{ label: "Overview" }]} />
      <Scaffold>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <StatCard
            icon="building"
            label="Organizations"
            value={loading ? "…" : orgs.length}
          />
          <StatCard
            icon="shield"
            label="Org admins"
            value={loading ? "…" : admins.length}
            tone="coral"
          />
          <StatCard
            icon="vote"
            label="Elections run"
            value={loading ? "…" : "—"}
            hint="Per-org list shown on each org card."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <ActionCard
            to="/superadmin/orgs/create"
            icon="plus-circle"
            title="Register a new organization"
            body="Create the org record, then invite its first admin."
          />
          <ActionCard
            to="/superadmin/orgs"
            icon="building"
            title="Browse organizations"
            body="See every tenant, drill into admins + elections."
          />
          <ActionCard
            to="/superadmin/health"
            icon="activity"
            title="Platform health"
            body="Redirect to Grafana: metrics, logs, traces, alerts."
          />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="display text-base font-semibold">Recent organizations</div>
            <Link to="/superadmin/orgs" className="text-sm coral font-semibold flex items-center gap-1">
              See all <Icon name="arrow-right" className="w-4 h-4" />
            </Link>
          </div>
          {loading
            ? <div className="ink-3 text-sm">Loading…</div>
            : orgs.length === 0
              ? <div className="ink-3 text-sm">
                  No organizations yet.{" "}
                  <Link to="/superadmin/orgs/create" className="coral font-semibold">Create one →</Link>
                </div>
              : <div className="space-y-1.5">
                  {orgs.slice(0, 6).map(o => {
                    const orgAdmins = adminsByOrg[o.id] || [];
                    return (
                      <Link
                        key={o.id}
                        to="/superadmin/admins"
                        state={{ orgId: o.id, orgName: o.name }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:surface-2"
                      >
                        <div className="w-9 h-9 rounded-lg grad-soft coral flex items-center justify-center font-semibold display">
                          {(o.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-sm" style={{ color: "var(--t1)" }}>
                            {o.name}
                          </div>
                          <div className="text-[11px] mono ink-3">{o.id?.slice(0, 8) || "—"}</div>
                        </div>
                        <div className="text-xs ink-3 whitespace-nowrap">
                          {orgAdmins.length} admin{orgAdmins.length === 1 ? "" : "s"}
                        </div>
                      </Link>
                    );
                  })}
                </div>
          }
        </div>
      </Scaffold>
    </AppShell>
  );
}

function StatCard({ icon, label, value, tone, hint }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone === "coral" ? "grad-soft coral" : "surface-2"}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] ink-3 uppercase tracking-widest">{label}</div>
        <div className="display text-2xl font-semibold">{value}</div>
        {hint && <div className="text-[10px] ink-3 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

function ActionCard({ to, icon, title, body }) {
  return (
    <Link to={to} className="card card-hover p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center shrink-0">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        <div className="ink-2 text-xs mt-1">{body}</div>
      </div>
      <Icon name="arrow-right" className="w-4 h-4 ink-3" />
    </Link>
  );
}
