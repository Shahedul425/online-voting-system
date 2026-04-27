// src/Components/Admin/Audit/AdminAuditLogs.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import AdminLayout from "../../../components/layout/AdminLayout";
import {
    Panel, ErrorBanner, Spinner, EmptyState, Btn, HintBox, Chip,
} from "../../../components/ui";

const STATUS_COLORS = {
    success: { bg: "var(--green-d)",  color: "var(--green)",  border: "var(--green-b)" },
    failed:  { bg: "var(--red-d)",    color: "var(--red)",    border: "rgba(247,111,111,.2)" },
    rejected:{ bg: "var(--orange-d)", color: "var(--orange)", border: "rgba(247,166,77,.2)" },
};

function AuditStatus({ status }) {
    const s   = String(status || "").toLowerCase();
    const cfg = STATUS_COLORS[s] ?? STATUS_COLORS.success;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status}
    </span>
    );
}

function ActionChip({ action }) {
    return (
        <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: "var(--purple-d)", color: "var(--purple)", border: "1px solid var(--purple-b)" }}>
      {action}
    </span>
    );
}

export default function AdminAuditLogs() {
    const { electionId } = useParams();
    const navigate        = useNavigate();
    const election        = useAppStore(s => s.election);

    const [filters, setFilters] = useState({ action: "", status: "", actorId: "", from: "", to: "" });
    const [page,    setPage]    = useState(0);
    const [size,    setSize]    = useState(20);
    const [rows,    setRows]    = useState([]);
    const [total,   setTotal]   = useState(0);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [selected, setSelected] = useState(null); // selected audit detail
    const [detail,   setDetail]   = useState(null); // loaded detail
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterOpen, setFilterOpen] = useState(true);

    async function search(pg = 0) {
        if (!electionId) return;
        setLoading(true); setError(null);
        // POST /audit/search → AuditSearchRequest → Page<AuditLogsModel>
        const res = await OVS.auditSearch({
            electionId,
            actorId:  filters.actorId || null,
            action:   filters.action  || null,
            status:   filters.status  || null,
            from:     filters.from    ? new Date(filters.from).toISOString() : null,
            to:       filters.to      ? new Date(filters.to).toISOString()   : null,
            page:     pg,
            size,
        });
        setLoading(false);
        if (!res.ok) { setError(toAppError(res)); return; }
        const data = res.data;
        setRows(Array.isArray(data) ? data : (data?.content ?? []));
        setTotal(typeof data?.totalElements === "number" ? data.totalElements : (Array.isArray(data) ? data.length : 0));
    }

    useEffect(() => { search(0); }, [electionId, size]);

    function onFilter(e) { setFilters(p => ({ ...p, [e.target.name]: e.target.value })); }

    async function selectRow(row) {
        setSelected(row);
        // GET /audit/{electionId}/{auditId}
        if (!row?.id || !electionId) return;
        setLoadingDetail(true);
        const res = await OVS.getAuditDetail({ electionId, auditId: row.id });
        setLoadingDetail(false);
        if (res.ok) setDetail(res.data);
        else setDetail(null);
    }

    const totalPages = Math.max(1, Math.ceil(total / size));
    const fmtDate    = v => { try { return new Date(v).toLocaleString(); } catch { return "—"; } };

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin",     path: "/admin" },
                { label: election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Audit Logs" },
            ]}
            topbarRight={
                <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                    <ArrowLeft size={12} /> Workspace
                </Btn>
            }
        >
            <div className="flex items-start justify-between flex-wrap gap-3 animate-up">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={15} style={{ color: "var(--purple)" }} />
                        <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Election · Audit Logs</span>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Audit Logs</h1>
                    <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                        {election?.name || electionId} · {total.toLocaleString()} records
                    </p>
                </div>
                <Btn variant="primary" loading={loading} onClick={() => { setPage(0); search(0); }}>
                    ⊙ Search
                </Btn>
            </div>

            {/* Filters */}
            <Panel
                className="animate-up"
                title="Filters"
                subtitle="POST /audit/search · AuditSearchRequest"
                action={
                    <Btn variant="ghost" size="sm" onClick={() => setFilterOpen(p => !p)}>
                        {filterOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </Btn>
                }
            >
                {filterOpen && (
                    <>
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: "Actor ID (UUID)", name: "actorId",  placeholder: "optional" },
                                { label: "Action",          name: "action",   placeholder: "e.g. VOTE_CAST" },
                                { label: "Status",          name: "status",   placeholder: "SUCCESS / FAILED" },
                                { label: "From",            name: "from",     placeholder: "", type: "datetime-local" },
                                { label: "To",              name: "to",       placeholder: "", type: "datetime-local" },
                            ].map(f => (
                                <div key={f.name} className="flex flex-col gap-1.5">
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>{f.label}</label>
                                    <input
                                        name={f.name} value={filters[f.name]} onChange={onFilter}
                                        type={f.type ?? "text"} placeholder={f.placeholder}
                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--t1)", fontSize: 12, fontFamily: "Inter", outline: "none" }}
                                        onFocus={e => (e.target.style.borderColor = "var(--purple-b)")}
                                        onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between mt-3">
              <span style={{ fontSize: 11.5, color: "var(--t3)" }}>
                Total: <strong style={{ color: "var(--t2)" }}>{total}</strong>
              </span>
                            <div className="flex items-center gap-2">
                                <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Page size</span>
                                <select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }}
                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--t1)", fontSize: 12, outline: "none" }}>
                                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </Panel>

            <ErrorBanner error={error} onClose={() => setError(null)} />

            <div className="grid gap-3 animate-up-2" style={{ gridTemplateColumns: "1fr 270px" }}>
                {/* Table */}
                <Panel noPad>
                    {loading ? <Spinner text="Loading audit logs…" /> : rows.length === 0 ? (
                        <EmptyState icon="⊙" title="No records found" subtitle="Adjust filters and search again." />
                    ) : (
                        <>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                <tr>
                                    {["When", "Action", "Status", "Details"].map(h => (
                                        <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((row, i) => (
                                    <tr
                                        key={row.id || i}
                                        onClick={() => selectRow(row)}
                                        style={{
                                            borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                            cursor: "pointer", transition: "background .12s",
                                            background: selected?.id === row.id ? "rgba(124,111,247,.05)" : "transparent",
                                        }}
                                        onMouseEnter={ev => { if (selected?.id !== row.id) ev.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                                        onMouseLeave={ev => { if (selected?.id !== row.id) ev.currentTarget.style.background = "transparent"; }}
                                    >
                                        <td style={{ padding: "12px 16px", fontSize: 11.5, color: "var(--t3)", fontFamily: "JetBrains Mono", whiteSpace: "nowrap" }}>
                                            {fmtDate(row.createdAt)}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <ActionChip action={row.action || "—"} />
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <AuditStatus status={row.status || row.outcome || "SUCCESS"} />
                                        </td>
                                        <td style={{ padding: "12px 16px", maxWidth: 240 }}>
                                            <div style={{ fontSize: 11.5, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {row.details || row.description || row.message || "—"}
                                            </div>
                                            {row.requestId && (
                                                <div style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--t3)", marginTop: 2 }}>{String(row.requestId).slice(0, 12)}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11.5, color: "var(--t3)" }}>
                  Page <strong style={{ color: "var(--t2)" }}>{page + 1}</strong> / {totalPages}
                </span>
                                <div className="flex gap-1.5">
                                    <Btn variant="ghost" size="sm" disabled={page === 0}              onClick={() => { setPage(0);       search(0); }}>«</Btn>
                                    <Btn variant="ghost" size="sm" disabled={page === 0}              onClick={() => { const p = page-1; setPage(p); search(p); }}>← Prev</Btn>
                                    <Btn variant="ghost" size="sm" disabled={page >= totalPages - 1}  onClick={() => { const p = page+1; setPage(p); search(p); }}>Next →</Btn>
                                    <Btn variant="ghost" size="sm" disabled={page >= totalPages - 1}  onClick={() => { const p = totalPages-1; setPage(p); search(p); }}>»</Btn>
                                </div>
                            </div>
                        </>
                    )}
                </Panel>

                {/* Detail panel */}
                <Panel title="Audit Detail" subtitle={selected ? "GET /audit/{electionId}/{auditId}" : "Click a row"} className="h-fit sticky top-4">
                    {!selected ? (
                        <div style={{ fontSize: 12, color: "var(--t3)", padding: "12px 0" }}>Select a row to see full audit detail.</div>
                    ) : loadingDetail ? (
                        <Spinner size={16} text="Loading…" />
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <ActionChip action={(detail ?? selected).action || "—"} />
                                <AuditStatus status={(detail ?? selected).status || (detail ?? selected).outcome || "SUCCESS"} />
                            </div>
                            {[
                                ["Created",    fmtDate((detail ?? selected).createdAt), false],
                                ["Request ID", (detail ?? selected).requestId || "—",   true],
                            ].map(([l, v, mono]) => (
                                <div key={l} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                                    <span style={{ fontSize: 12, color: "var(--t2)" }}>{l}</span>
                                    <span style={{ fontSize: mono ? 10.5 : 12.5, fontFamily: mono ? "JetBrains Mono" : "inherit", fontWeight: 600, color: "var(--t1)" }}>{v}</span>
                                </div>
                            ))}

                            {/* Actor section */}
                            {((detail ?? selected).actorEmail || (detail ?? selected).actorRole) && (
                                <div className="rounded-lg px-3 py-3 mt-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 8 }}>Actor</div>
                                    {(detail ?? selected).actorEmail && (
                                        <div className="flex justify-between mb-1.5">
                                            <span style={{ fontSize: 11.5, color: "var(--t2)" }}>Email</span>
                                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--t1)" }}>{(detail ?? selected).actorEmail}</span>
                                        </div>
                                    )}
                                    {(detail ?? selected).actorRole && (
                                        <div className="flex justify-between">
                                            <span style={{ fontSize: 11.5, color: "var(--t2)" }}>Role</span>
                                            <Chip variant="purple">{(detail ?? selected).actorRole}</Chip>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Raw detail */}
                            {(detail ?? selected).details && (
                                <div className="mt-3">
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 6 }}>Details</div>
                                    <div style={{ fontSize: 11.5, color: "var(--t2)", lineHeight: 1.6 }}>{(detail ?? selected).details}</div>
                                </div>
                            )}
                        </>
                    )}
                </Panel>
            </div>
        </AdminLayout>
    );
}
