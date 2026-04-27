/*
 * SuperOrgs — list of every tenant on the platform.
 *
 * Backend:
 *   GET /superadmin/org/all → List<OrganizationModel>
 *                              { id, name, type, allowedDomains[], country }
 *   GET /superadmin/admins  → List<AdminListItem>  (every user with role=admin
 *                              across every org — we group by organizationId)
 *
 * Cards expose: type, country, allowed sign-up domains, admin avatars + count,
 * and the whole card is a clickable link into /superadmin/orgs/:id where the
 * admin list is rendered in detail.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { EmptyState } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function SuperOrgs() {
  const [orgs, setOrgs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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

  const adminsByOrg = useMemo(() => {
    const m = {};
    for (const a of admins) {
      const k = a.organizationId;
      if (!k) continue;
      (m[k] ||= []).push(a);
    }
    return m;
  }, [admins]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orgs;
    return orgs.filter(o => {
      const name    = (o.name || "").toLowerCase();
      const type    = (o.type || "").toLowerCase();
      const country = (o.country || "").toLowerCase();
      const domains = (o.allowedDomains || []).join(" ").toLowerCase();
      const orgAdmins = adminsByOrg[o.id] || [];
      const adminEmails = orgAdmins.map(a => a.email || "").join(" ").toLowerCase();
      return name.includes(needle) || type.includes(needle) ||
             country.includes(needle) || domains.includes(needle) ||
             adminEmails.includes(needle);
    });
  }, [orgs, q, adminsByOrg]);

  return (
    <AppShell role="superadmin" active="/superadmin/orgs">
      <Topbar
        title="Organizations"
        crumbs={[{ label: "Organizations" }]}
        right={
          <Link to="/superadmin/orgs/create" className="btn btn-primary">
            <Icon name="plus" className="w-4 h-4" />New organization
          </Link>
        }
      />
      <Scaffold>
        <div className="card p-3 mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 surface-2 rounded-lg flex-1">
            <Icon name="search" className="w-4 h-4 ink-3" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name, type, country, domain, or admin email…"
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: "var(--t1)" }}
            />
          </div>
          <div className="text-xs ink-3 ml-2">
            {filtered.length === orgs.length
              ? `${orgs.length} total`
              : `${filtered.length} of ${orgs.length}`}
          </div>
        </div>

        {loading
          ? <div className="card p-8 text-center ink-3 text-sm">Loading…</div>
          : filtered.length === 0
            ? <EmptyState
                icon="building-2"
                title={q ? "No matches" : "No organizations"}
                body={q ? "Try a different search term." : "Register your first tenant to get started."}
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(o =>
                  <OrgCard key={o.id} org={o} admins={adminsByOrg[o.id] || []} />
                )}
              </div>
        }
      </Scaffold>
    </AppShell>
  );
}

function OrgCard({ org, admins }) {
  const domains = Array.isArray(org.allowedDomains) ? org.allowedDomains : [];
  const visibleDomains = domains.slice(0, 3);
  const overflowDomains = domains.length - visibleDomains.length;

  const visibleAdmins  = admins.slice(0, 4);
  const overflowAdmins = admins.length - visibleAdmins.length;

  return (
    <Link
      to={`/superadmin/orgs/${org.id}`}
      className="card card-hover p-4 flex flex-col group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl grad-soft coral flex items-center justify-center font-semibold display text-lg shrink-0">
          {(org.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ color: "var(--t1)" }}>
            {org.name}
          </div>
          <div className="text-[11px] mono ink-3 truncate">{org.id?.slice(0, 8)}…</div>
        </div>
        <Icon name="arrow-right" className="w-4 h-4 ink-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px]" style={{ color: "var(--t2)" }}>
        {org.type && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full surface-2"
                style={{ border: "1px solid var(--hairline)" }}>
            <Icon name="layers" className="w-3 h-3" /> {org.type}
          </span>
        )}
        {org.country && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full surface-2"
                style={{ border: "1px solid var(--hairline)" }}>
            <Icon name="globe" className="w-3 h-3" /> {org.country}
          </span>
        )}
      </div>

      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">
        Allowed sign-up domains
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
        {visibleDomains.length === 0
          ? <span className="text-[11px] ink-3 italic">No domains configured</span>
          : visibleDomains.map(d => (
              <span
                key={d}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md mono text-[11px]"
                style={{
                  background: "rgba(232, 124, 102, 0.08)",
                  color: "var(--coral)",
                  border: "1px solid rgba(232, 124, 102, 0.18)",
                }}
                title={d}
              >
                @{d}
              </span>
            ))
        }
        {overflowDomains > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ink-3 surface-2"
                style={{ border: "1px solid var(--hairline)" }}>
            +{overflowDomains}
          </span>
        )}
      </div>

      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">Admins</div>
      <div className="flex items-center gap-2 mb-3 min-h-[34px]">
        {admins.length === 0
          ? <span className="text-[11px] ink-3 italic">No admins assigned yet</span>
          : (
            <>
              <div className="flex -space-x-1.5">
                {visibleAdmins.map(a => (
                  <div
                    key={a.id}
                    className="w-7 h-7 rounded-full grad-soft coral flex items-center justify-center text-[11px] font-semibold display"
                    style={{ border: "2px solid var(--surface)" }}
                    title={a.email}
                  >
                    {(a.email || "?").charAt(0).toUpperCase()}
                  </div>
                ))}
                {overflowAdmins > 0 && (
                  <div
                    className="w-7 h-7 rounded-full surface-2 flex items-center justify-center text-[10px] ink-2 font-semibold"
                    style={{ border: "2px solid var(--surface)" }}
                  >
                    +{overflowAdmins}
                  </div>
                )}
              </div>
              <div className="text-[11px] ink-3 truncate">
                {visibleAdmins.length === 1
                  ? visibleAdmins[0].email
                  : `${admins.length} ${admins.length === 1 ? "admin" : "admins"}`}
              </div>
            </>
          )
        }
      </div>

      <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs"
           style={{ borderColor: "var(--hairline)", color: "var(--t2)" }}>
        <span className="inline-flex items-center gap-1">
          <Icon name="shield" className="w-3.5 h-3.5" />
          {admins.length} {admins.length === 1 ? "admin" : "admins"}
        </span>
        <span className="inline-flex items-center gap-1 ink-3">
          {domains.length} {domains.length === 1 ? "domain" : "domains"}
        </span>
      </div>
    </Link>
  );
}
