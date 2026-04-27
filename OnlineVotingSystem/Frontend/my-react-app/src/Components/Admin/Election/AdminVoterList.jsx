// src/Components/Admin/Voters/AdminVoterList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, ArrowLeft, Users } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import AdminLayout from "../../../components/layout/AdminLayout";
import { Panel, ErrorBanner, Spinner, EmptyState, Btn } from "../../ui";

function VoterStatus({ status }) {
    const s = String(status || "").toLowerCase();
    const styles = {
        voted:    { bg: "var(--green-d)",  color: "var(--green)",  border: "var(--green-b)",               label: "✓ Voted"   },
        eligible: { bg: "rgba(255,255,255,.04)", color: "var(--t3)", border: "var(--border)",              label: "Eligible" },
        blocked:  { bg: "var(--red-d)",    color: "var(--red)",    border: "rgba(247,111,111,.2)",          label: "Blocked"  },
    };
    const cfg = styles[s] ?? styles.eligible;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 600,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        }}>
      {cfg.label}
    </span>
    );
}

export default function AdminVoterList() {
    const { electionId } = useParams();
    const navigate        = useNavigate();
    const election        = useAppStore(s => s.election);

    const [voters,  setVoters]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [q, setQ]             = useState("");
    const [page, setPage]       = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        let alive = true;
        async function load() {
            if (!electionId) return;
            setLoading(true); setError(null);
            const res = await OVS.getVoterListByElection({ electionId });
            if (!alive) return;
            setLoading(false);
            if (!res.ok) { setError(toAppError(res)); return; }
            setVoters(Array.isArray(res.data) ? res.data : (res.data?.content ?? []));
        }
        load();
        return () => { alive = false; };
    }, [electionId]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return s
            ? voters.filter(v =>
                String(v.voterId || "").toLowerCase().includes(s) ||
                String(v.email   || "").toLowerCase().includes(s)
            )
            : voters;
    }, [voters, q]);

    const paginated   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const voted   = voters.filter(v => String(v.status || "").toLowerCase() === "voted").length;
    const blocked = voters.filter(v => String(v.status || "").toLowerCase() === "blocked").length;

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin",     path: "/admin" },
                { label: election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Voter List" },
            ]}
            topbarRight={
                <div className="flex items-center gap-2">
                    <Btn variant="ghost" size="sm">↓ Export CSV</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                        <ArrowLeft size={12} /> Workspace
                    </Btn>
                </div>
            }
        >
            {/* Header + mini kpis */}
            <div className="flex items-start justify-between flex-wrap gap-4 animate-up">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={15} style={{ color: "var(--purple)" }} />
                        <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Election · Voter List</span>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Voter List</h1>
                    <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                        {election?.name || electionId} · {voters.length.toLocaleString()} voters
                    </p>
                </div>
                <div className="flex gap-3">
                    {[
                        ["Voted",    voted,                   "var(--green-d)",  "var(--green)",  "var(--green-b)"],
                        ["Eligible", voters.length - voted - blocked, "var(--surface)", "var(--t1)", "var(--border)"],
                        ["Blocked",  blocked,                 "var(--red-d)",    "var(--red)",    "rgba(247,111,111,.2)"],
                    ].map(([l, v, bg, color, border]) => (
                        <div key={l} className="rounded-xl px-4 py-3 text-center" style={{ background: bg, border: `1px solid ${border}`, minWidth: 80 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color }}>{v.toLocaleString()}</div>
                            <div style={{ fontSize: 10.5, color: "var(--t2)", marginTop: 2 }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", maxWidth: 380 }}>
                <Search size={14} style={{ color: "var(--t3)", flexShrink: 0 }} />
                <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }}
                       placeholder="Search voter ID or email…"
                       style={{ background: "transparent", border: "none", color: "var(--t1)", fontSize: 13, outline: "none", flex: 1 }} />
            </div>

            <ErrorBanner error={error} onClose={() => setError(null)} />

            <Panel className="animate-up-2" noPad>
                {loading ? <Spinner text="Loading voters…" /> : filtered.length === 0 ? (
                    <EmptyState icon="👥" title="No voters found" subtitle={q ? "Try a different search." : "No voters uploaded for this election."} />
                ) : (
                    <>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr>
                                {["Voter ID", "Email", "Status", "Voted At"].map(h => (
                                    <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.map((v, i) => (
                                <tr key={v.id || v.voterId || i} style={{ borderBottom: i < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background .12s" }}
                                    onMouseEnter={ev => ev.currentTarget.style.background = "rgba(255,255,255,.02)"}
                                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", fontSize: 12.5, color: "var(--t1)", fontWeight: 600 }}>{v.voterId || v.studentId || "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--t2)" }}>{v.email || "—"}</td>
                                    <td style={{ padding: "12px 16px" }}><VoterStatus status={v.status} /></td>
                                    <td style={{ padding: "12px 16px", fontSize: 11.5, color: "var(--t3)", fontFamily: "JetBrains Mono" }}>
                                        {v.votedAt ? new Date(v.votedAt).toLocaleString() : "—"}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11.5, color: "var(--t3)" }}>
                  Page <strong style={{ color: "var(--t2)" }}>{page + 1}</strong> / {totalPages} · {filtered.length} results
                </span>
                                <div className="flex gap-1.5">
                                    <Btn variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                                        return (
                                            <Btn key={pg} variant={pg === page ? "primary" : "ghost"} size="sm" onClick={() => setPage(pg)}>{pg + 1}</Btn>
                                        );
                                    })}
                                    <Btn variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Btn>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Panel>
        </AdminLayout>
    );
}


// ─── AdminCandidateList ───────────────────────────────────────────────────────
export function AdminCandidateList() {
    const { electionId } = useParams();
    const navigate        = useNavigate();
    const election        = useAppStore(s => s.election);

    const [candidates, setCandidates] = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);
    const [q, setQ]                   = useState("");

    useEffect(() => {
        let alive = true;
        async function load() {
            if (!electionId) return;
            setLoading(true);
            const res = await OVS.getCandidates({ electionId });
            if (!alive) return;
            setLoading(false);
            if (!res.ok) { setError(toAppError(res)); return; }
            setCandidates(Array.isArray(res.data) ? res.data : []);
        }
        load();
        return () => { alive = false; };
    }, [electionId]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return s ? candidates.filter(c =>
            [`${c.firstName} ${c.lastName}`, c.party, c.position, c.ballotSerial]
                .join(" ").toLowerCase().includes(s)
        ) : candidates;
    }, [candidates, q]);

    function ini(c) {
        return [`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(), c.name ?? ""].join("").substring(0, 2).toUpperCase() || "?";
    }

    const positions = [...new Set(filtered.map(c => c.position).filter(Boolean))].sort();

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin",     path: "/admin" },
                { label: election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Candidate List" },
            ]}
            topbarRight={
                <div className="flex gap-2">
                    <Btn variant="ghost" size="sm">↓ Export CSV</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}><ArrowLeft size={12} /> Workspace</Btn>
                </div>
            }
        >
            <div className="flex items-start justify-between flex-wrap gap-4 animate-up">
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Candidate List</h1>
                    <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                        {election?.name || electionId} · {candidates.length} candidates
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", width: 320 }}>
                    <Search size={14} style={{ color: "var(--t3)" }} />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, party, position…"
                           style={{ background: "transparent", border: "none", color: "var(--t1)", fontSize: 13, outline: "none", flex: 1 }} />
                </div>
            </div>

            <ErrorBanner error={error} onClose={() => setError(null)} />

            {loading ? <Spinner text="Loading candidates…" /> :
                filtered.length === 0 ? (
                    <EmptyState icon="☑" title="No candidates found" subtitle={q ? "Try a different search." : "No candidates uploaded."} />
                ) : (
                    <div className="flex flex-col gap-6 animate-up-2">
                        {positions.map(pos => (
                            <div key={pos}>
                                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--purple)", marginBottom: 10 }}>
                                    {pos}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {filtered.filter(c => c.position === pos).map(c => (
                                        <div key={c.id} className="rounded-xl overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                            <div className="flex items-center justify-center h-[80px]" style={{ background: "var(--surface-3)", fontSize: 26, fontWeight: 700, color: "var(--t3)" }}>
                                                {c.photoUrl
                                                    ? <img src={c.photoUrl} alt="" className="h-full w-full object-cover" onError={e => e.currentTarget.style.display="none"} />
                                                    : ini(c)}
                                            </div>
                                            <div className="p-3">
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>
                                                    {`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.name || "—"}
                                                </div>
                                                <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 3 }}>{c.party || "Independent"}</div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span style={{ fontSize: 10.5, color: "var(--t3)" }}>{c.position}</span>
                                                    <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>#{c.ballotSerial}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </AdminLayout>
    );
}
