/*
 * AdminAudit — election-scoped audit log.
 *
 * Backend rule (DAO/AuditSearchRequest): electionId is @NotNull.
 * That means every audit query MUST be tied to a specific election.
 *
 * Routing:
 *   /admin/elections/:id/audit  → search the audit log for that election
 *   /admin/audit                → show a picker so the admin can choose
 *
 * Endpoint: OVS.auditSearch(payload)  — POST /audit/search
 * Payload : { electionId, action?, entityType?, fromTime?, toTime?, page, size }
 * Response: Page<AuditLogsModel> (Spring Data)
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, EmptyState, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";
import { useAppStore } from "../../Service/GlobalState/appStore";

export default function AdminAudit() {
  const { id } = useParams();      // election ID, optional
  if (!id) return <ElectionPicker />;
  return <ScopedAudit electionId={id} />;
}

/* ─────────────────────────── Picker ───────────────────────────── */

function ElectionPicker() {
  const me = useAppStore(s => s.me);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!me?.organizationId) return;
    setLoading(true);
    withUnwrap(OVS.getAllElections({ orgId: me.organizationId }))
      .then(d => setElections(Array.isArray(d) ? d : []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, [me]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return elections;
    return elections.filter(e => (e.name || "").toLowerCase().includes(needle));
  }, [elections, q]);

  return (
    <AppShell role="admin" active="/admin/audit">
      <Topbar
        title="Audit log"
        crumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Audit" }]}
      />
      <Scaffold>
        <div className="card p-5 mb-4">
          <div className="display text-lg font-semibold mb-1">Pick an election</div>
          <p className="text-sm ink-2">
            The audit log is scoped to a single election. Choose one to see every
            administrative action and ballot event recorded for it, with request
            IDs you can cross-reference against metrics and traces.
          </p>
        </div>

        <div className="card p-3 mb-3 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 surface-2 rounded-lg flex-1">
            <Icon name="search" className="w-4 h-4 ink-3" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search elections…"
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: "var(--t1)" }}
            />
          </div>
          <div className="text-xs ink-3 ml-2">
            {loading ? "Loading…" : `${filtered.length} of ${elections.length}`}
          </div>
        </div>

        {loading
          ? <div className="card p-8 text-center ink-3 text-sm">Loading…</div>
          : filtered.length === 0
            ? <EmptyState
                icon="inbox"
                title={q ? "No matches" : "No elections"}
                body={q ? "Try a different search term." : "Create an election first — audit rows are written as you run it."}
              />
            : <div className="space-y-2">
                {filtered.map(e => (
                  <Link
                    key={e.id}
                    to={`/admin/elections/${e.id}/audit`}
                    className="card card-hover p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center">
                      <Icon name="scroll-text" className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold truncate">{e.name}</div>
                        <StatusPill status={e.status} />
                      </div>
                      <div className="text-[11px] mono ink-3 truncate">{e.id}</div>
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

/* ────────────────────────── Scoped audit ───────────────────────── */

const STATUS_OPTIONS = [
  { value: "",                 label: "Any status" },
  { value: "SUCCESS",          label: "Success" },
  { value: "REJECTED",         label: "Rejected" },
  { value: "FAILED",           label: "Failed" },
  { value: "VALIDATION_FAILED", label: "Validation failed" },
];

function ScopedAudit({ electionId }) {
  const [election, setElection] = useState(null);
  const [filters, setFilters] = useState({ action: "", status: "" });
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageMeta, setPageMeta] = useState({ totalElements: 0 });

  useEffect(() => {
    withUnwrap(OVS.getElectionById({ id: electionId }))
      .then(setElection)
      .catch(() => setElection(null));
  }, [electionId]);

  const search = async (overrides = {}) => {
    setLoading(true);
    try {
      const merged = { ...filters, ...overrides };
      const payload = {
        electionId,
        action: merged.action || null,
        status: merged.status || null,
        page: 0,
        size: 200,
      };
      const page = await withUnwrap(OVS.auditSearch(payload));
      setRows(page?.content || []);
      setPageMeta({ totalElements: page?.totalElements ?? page?.content?.length ?? 0 });
    } catch (e) {
      setRows([]);
      setPageMeta({ totalElements: 0 });
    } finally {
      setLoading(false);
    }
  };

  // initial load + reload when election id changes
  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  const reset = () => {
    setFilters({ action: "", status: "" });
    search({ action: "", status: "" });
  };

  return (
    <AppShell role="admin" active="/admin/audit">
      <Topbar
        title="Audit log"
        crumbs={[
          { label: "Elections", path: "/admin/elections" },
          { label: election?.name || electionId.slice(0, 8) + "…", path: `/admin/elections/${electionId}` },
          { label: "Audit" },
        ]}
        right={
          <Link to="/admin/audit" className="btn btn-ghost">
            <Icon name="list" className="w-4 h-4" /> Other elections
          </Link>
        }
      />
      <Scaffold>
        <div className="card p-4 mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="display font-semibold truncate" style={{ color: "var(--t1)" }}>
              {election?.name || "Loading…"}
            </div>
            <div className="text-[11px] mono ink-3 truncate">election {electionId}</div>
          </div>
          {election && (
            <div className="flex items-center gap-2">
              <StatusPill status={election.status} />
              <Link to={`/admin/elections/${electionId}`} className="btn btn-ghost">
                <Icon name="arrow-left" className="w-4 h-4" /> Back to workspace
              </Link>
            </div>
          )}
        </div>

        <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
          <Field
            label="Action"
            value={filters.action}
            onChange={v => setFilters(f => ({ ...f, action: v }))}
            placeholder="e.g. VOTE_CAST"
          />
          <SelectField
            label="Status"
            value={filters.status}
            onChange={v => setFilters(f => ({ ...f, status: v }))}
            options={STATUS_OPTIONS}
          />
          <Btn variant="primary" onClick={() => search()} disabled={loading}>
            <Icon name="search" className="w-4 h-4" />
            {loading ? "Searching…" : "Search"}
          </Btn>
          {(filters.action || filters.status) && (
            <Btn variant="ghost" onClick={reset}>
              <Icon name="x" className="w-4 h-4" /> Clear
            </Btn>
          )}
          <div className="ml-auto text-xs ink-3">
            {pageMeta.totalElements
              ? `${pageMeta.totalElements} ${pageMeta.totalElements === 1 ? "row" : "rows"}`
              : ""}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="surface-2 text-xs ink-3 uppercase tracking-widest">
                <th className="px-4 py-2.5 text-left">Timestamp (UTC)</th>
                <th className="px-4 py-2.5 text-left">Action</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Actor</th>
                <th className="px-4 py-2.5 text-left">Entity</th>
                <th className="px-4 py-2.5 text-left">Request ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center ink-3">
                    {loading ? "Loading…" : "No rows match these filters."}
                  </td>
                </tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-t hairline">
                  <td className="px-4 py-2.5 mono text-xs whitespace-nowrap">
                    {fmtDateTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="chip" style={{ background: "var(--surface-2)" }}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <ActorCell actor={r.actor} />
                  </td>
                  <td className="px-4 py-2.5 mono text-xs ink-2">
                    {r.entityId ? r.entityId : "—"}
                  </td>
                  <td className="px-4 py-2.5 mono text-xs ink-3">
                    {r.requestId ? `${r.requestId.slice(0, 12)}…` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Scaffold>
    </AppShell>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block min-w-[160px]">
      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 rounded-lg surface-2 text-sm w-full outline-none"
        style={{ border: "1px solid var(--hairline)", color: "var(--t1)" }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block min-w-[160px]">
      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg surface-2 text-sm w-full outline-none"
        style={{ border: "1px solid var(--hairline)", color: "var(--t1)" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

/* Coloured pill for ActionStatus enum (SUCCESS / FAILED / REJECTED / VALIDATION_FAILED). */
function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  const map = {
    SUCCESS:           { label: "Success",      bg: "rgba(38,173,129,0.12)",  color: "var(--green, #26AD81)" },
    FAILED:            { label: "Failed",       bg: "rgba(193,69,69,0.10)",   color: "var(--err, #C14545)"   },
    REJECTED:          { label: "Rejected",     bg: "rgba(232,124,102,0.12)", color: "var(--coral)"          },
    VALIDATION_FAILED: { label: "Validation",   bg: "rgba(255,170,80,0.14)",  color: "#C97A2B"               },
  };
  const m = map[s] || { label: status || "—", bg: "var(--surface-2)", color: "var(--t2)" };
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: m.bg, color: m.color, border: "1px solid var(--hairline)" }}
    >
      {m.label}
    </span>
  );
}

/* Pull the most useful identity out of the nested actor object the backend returns.
   AuditLogsModel.actor is a UserModel (email + role), so we prefer email and tag the
   role next to it. Falls back gracefully when the actor was system / unknown. */
function ActorCell({ actor }) {
  if (!actor) return <span className="ink-3">—</span>;
  const email = actor.email || actor.username;
  const role  = actor.role  || actor.realmRole;
  if (!email && !role) return <span className="ink-3">—</span>;
  return (
    <div className="flex flex-col leading-tight">
      <span className="truncate" style={{ color: "var(--t1)" }}>{email || role}</span>
      {email && role && (
        <span className="text-[10px] ink-3 uppercase tracking-wider">{role}</span>
      )}
    </div>
  );
}
