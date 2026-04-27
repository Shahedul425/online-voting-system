/*
 * SuperOrgDetail — read-only deep-dive into a single tenant.
 *
 * Backend:
 *   GET /superadmin/org/all     → find this org by id
 *   GET /superadmin/org/{id}/admins → List<AdminListItem>
 *
 * Surfaces everything a superadmin actually wants when triaging a tenant:
 *   • org meta (name, type, country, allowed domains)
 *   • full admin roster with emails + creation timestamps
 *   • CTAs to assign another admin or jump back to the listing
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, EmptyState } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";

export default function SuperOrgDetail() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([
      withUnwrap(OVS.getAllOrganizations()),
      withUnwrap(OVS.getOrgAdmins({ orgId: id })),
    ]).then(([oResp, aResp]) => {
      if (cancelled) return;
      if (oResp.status === "fulfilled" && Array.isArray(oResp.value)) {
        const found = oResp.value.find(o => o.id === id);
        setOrg(found || null);
        if (!found) setErr("That organisation could not be found.");
      } else {
        setErr("Could not load organisations.");
      }
      setAdmins(aResp.status === "fulfilled" && Array.isArray(aResp.value) ? aResp.value : []);
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <AppShell role="superadmin" active="/superadmin/orgs">
        <Scaffold><div className="ink-3 text-sm">Loading…</div></Scaffold>
      </AppShell>
    );
  }

  if (!org) {
    return (
      <AppShell role="superadmin" active="/superadmin/orgs">
        <Scaffold>
          <div className="card p-8 text-center">
            <Icon name="alert-triangle" className="w-10 h-10 coral mx-auto mb-3" />
            <div className="display text-lg font-semibold mb-1">Organization not found</div>
            <p className="text-sm ink-2 mb-4">{err || "This tenant doesn't exist anymore."}</p>
            <Link to="/superadmin/orgs" className="btn btn-primary">
              <Icon name="arrow-left" className="w-4 h-4" /> Back to organizations
            </Link>
          </div>
        </Scaffold>
      </AppShell>
    );
  }

  const domains = Array.isArray(org.allowedDomains) ? org.allowedDomains : [];

  return (
    <AppShell role="superadmin" active="/superadmin/orgs">
      <Topbar
        title={org.name}
        crumbs={[
          { label: "Organizations", path: "/superadmin/orgs" },
          { label: org.name },
        ]}
        right={
          <Link
            to="/superadmin/admins"
            state={{ orgId: org.id, orgName: org.name }}
            className="btn btn-primary"
          >
            <Icon name="user-plus" className="w-4 h-4" /> Assign admin
          </Link>
        }
      />
      <Scaffold>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <StatCard icon="shield"   label="Admins"  value={admins.length} tone="coral" />
          <StatCard icon="globe"    label="Country" value={org.country || "—"} small />
          <StatCard icon="layers"   label="Type"    value={org.type    || "—"} small />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="card p-5">
            <div className="display text-lg font-semibold mb-3">Organisation</div>
            <Row label="Name" value={org.name} />
            <Row label="ID"   value={org.id} mono />
            <Row label="Type" value={org.type || "—"} />
            <Row label="Country" value={org.country || "—"} />
          </div>
          <div className="card p-5">
            <div className="display text-lg font-semibold mb-3">Allowed sign-up domains</div>
            <p className="text-xs ink-3 mb-3">
              Anyone whose email ends in one of these is auto-routed here on signup.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {domains.length === 0
                ? <span className="text-[11px] ink-3 italic">No domains configured</span>
                : domains.map(d => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md mono text-[11px]"
                      style={{
                        background: "rgba(232, 124, 102, 0.08)",
                        color: "var(--coral)",
                        border: "1px solid rgba(232, 124, 102, 0.18)",
                      }}
                    >
                      @{d}
                    </span>
                  ))
              }
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b hairline">
            <div className="display text-lg font-semibold">Admins ({admins.length})</div>
            <Link
              to="/superadmin/admins"
              state={{ orgId: org.id, orgName: org.name }}
              className="text-xs coral font-semibold inline-flex items-center gap-1"
            >
              <Icon name="user-plus" className="w-3.5 h-3.5" /> Assign another
            </Link>
          </div>
          {admins.length === 0
            ? <div className="p-8">
                <EmptyState
                  icon="shield"
                  title="No admins yet"
                  body="Assign an admin so they can run elections for this organisation."
                />
              </div>
            : <table className="w-full text-sm">
                <thead>
                  <tr className="surface-2 text-xs ink-3 uppercase tracking-widest">
                    <th className="px-4 py-2.5 text-left">Email</th>
                    <th className="px-4 py-2.5 text-left">Role</th>
                    <th className="px-4 py-2.5 text-left">Joined</th>
                    <th className="px-4 py-2.5 text-left">User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id} className="border-t hairline">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full grad-soft coral flex items-center justify-center text-[11px] font-semibold display shrink-0">
                            {(a.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: "var(--t1)" }}>{a.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            background: "rgba(232, 124, 102, 0.12)",
                            color: "var(--coral)",
                          }}
                        >
                          {a.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 mono text-xs ink-2">
                        {a.createdAt ? fmtDateTime(a.createdAt) : "—"}
                      </td>
                      <td className="px-4 py-2.5 mono text-xs ink-3">{a.id?.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </Scaffold>
    </AppShell>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b hairline last:border-0">
      <div className="text-xs ink-3 uppercase tracking-widest w-24 shrink-0">{label}</div>
      <div className={`text-sm break-all ${mono ? "mono" : ""}`} style={{ color: "var(--t1)" }}>
        {value}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone, small }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone === "coral" ? "grad-soft coral" : "surface-2"}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] ink-3 uppercase tracking-widest">{label}</div>
        <div className={`display font-semibold ${small ? "text-base capitalize" : "text-2xl"}`}>{value}</div>
      </div>
    </div>
  );
}
