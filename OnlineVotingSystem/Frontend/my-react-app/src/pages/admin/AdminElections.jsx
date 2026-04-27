/*
 * AdminElections — full election list with search + status filter.
 *
 * The status filter is URL-driven: /admin/elections?status=draft (or running,
 * closed, published). Hitting one of the dashboard KPIs drops you here with
 * the right filter already applied. Users can also click the in-page tabs
 * which keep the URL in sync (so refresh / back-button / share-link all work).
 *
 * Endpoint: OVS.getAllElections({ orgId })
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { StatusPill, EmptyState } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { useAppStore } from "../../Service/GlobalState/appStore";

const FILTERS = ["all", "draft", "running", "closed", "published"];

export default function AdminElections() {
  const me = useAppStore(s => s.me);
  const [params, setParams] = useSearchParams();
  const urlStatus = (params.get("status") || "all").toLowerCase();
  const filter = FILTERS.includes(urlStatus) ? urlStatus : "all";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!me?.organizationId) return;
    setLoading(true);
    withUnwrap(OVS.getAllElections({ orgId: me.organizationId }))
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [me]);

  const setFilter = (f) => {
    const next = new URLSearchParams(params);
    if (f === "all") next.delete("status");
    else next.set("status", f);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data
      .filter(e => filter === "all" || (e.status || "").toLowerCase() === filter)
      .filter(e => !needle || (e.name || "").toLowerCase().includes(needle));
  }, [data, filter, q]);

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title="Elections"
        crumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Elections" }]}
        right={
          <Link to="/admin/elections/create" className="btn btn-primary">
            <Icon name="plus" className="w-4 h-4" />New election
          </Link>
        }
      />
      <Scaffold>
        <div className="card p-3 mb-5 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 surface-2 rounded-lg flex-1 min-w-[220px]">
            <Icon name="search" className="w-4 h-4 ink-3" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search elections…"
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: "var(--t1)" }}
            />
          </div>
          <div className="flex gap-1 surface-2 p-1 rounded-lg">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${
                  filter === f ? "surface font-semibold" : "ink-2"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filter !== "all" && (
          <div className="flex items-center gap-2 mb-3 text-xs ink-3">
            <span>
              Showing{" "}
              <strong style={{ color: "var(--t1)" }} className="capitalize">{filter}</strong>{" "}
              elections only.
            </span>
            <button
              onClick={() => setFilter("all")}
              className="underline coral font-medium"
            >
              Clear filter
            </button>
          </div>
        )}

        {loading
          ? <div className="card p-8 text-center ink-3 text-sm">Loading…</div>
          : filtered.length === 0
            ? <EmptyState
                icon="inbox"
                title="No elections"
                body={filter === "all"
                  ? "Create your first election to get started."
                  : `No ${filter} elections right now.`}
              />
            : <div className="space-y-2">
                {filtered.map(e => (
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
                        <div className="font-semibold truncate">{e.name}</div>
                        <StatusPill status={e.status} />
                      </div>
                      <div className="text-xs ink-3">
                        {e.totalVoters || 0} eligible · {e.votedCount || 0} cast
                      </div>
                    </div>
                    <Icon name="chevron-right" className="w-4 h-4 ink-3" />
                  </Link>
                ))}
              </div>
        }
      </Scaffold>
    </AppShell>
  );
}
