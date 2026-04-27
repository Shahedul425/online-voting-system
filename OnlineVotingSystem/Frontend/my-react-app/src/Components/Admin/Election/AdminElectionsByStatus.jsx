// src/Components/Admin/Election/AdminElectionsByStatus.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, FolderOpen, ArrowLeft } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import AdminLayout from "../../../components/layout/AdminLayout";
import { Panel, ErrorBanner, Spinner, EmptyState, StatusPill, Select, Btn } from "../../ui";

const STATUSES = ["draft", "running", "stopped", "closed", "published"];

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

const STATUS_LABELS = {
    draft: "Draft Elections", running: "Running Elections", stopped: "Stopped Elections",
    closed: "Closed Elections", published: "Published Elections",
};

export default function AdminElectionsByStatus() {
    const navigate     = useNavigate();
    const qsp          = useQuery();
    const me           = useAppStore(s => s.me);
    const setElection  = useAppStore(s => s.setElection);

    const statusFromUrl = (qsp.get("status") || "draft").toLowerCase();
    const [status, setStatus] = useState(STATUSES.includes(statusFromUrl) ? statusFromUrl : "draft");
    const [q, setQ]           = useState("");
    const [rows, setRows]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

    const orgId = me?.organizationId || me?.organization?.id;

    useEffect(() => {
        let alive = true;
        async function load() {
            setError(null); setLoading(true);
            const res = await OVS.getElectionByStatus({ status, orgId });
            if (!alive) return;
            setLoading(false);
            if (!res.ok) { setError(toAppError(res)); return; }
            const list = Array.isArray(res.data) ? res.data : [];
            setRows(orgId ? list.filter(e => {
                const eid = e?.organization?.id || e?.organizationId;
                return !eid || String(eid) === String(orgId);
            }) : list);
        }
        load();
        return () => { alive = false; };
    }, [status, orgId]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return s ? rows.filter(e => (e.name || "").toLowerCase().includes(s)) : rows;
    }, [rows, q]);

    function openElection(e) {
        setElection(e);
        navigate(`/admin/elections/${e.id}`);
    }

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin", path: "/admin" },
                { label: "Elections" },
                { label: STATUS_LABELS[status] ?? "Elections" },
            ]}
            topbarRight={
                <Btn variant="primary" onClick={() => navigate("/admin/elections/create")}>
                    + New Election
                </Btn>
            }
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap animate-up">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FolderOpen size={16} style={{ color: "var(--purple)" }} />
                        <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Elections</span>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>
                        {STATUS_LABELS[status] ?? "Elections"}
                    </h1>
                    <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                        Pick an election to open its workspace — uploads, voters, candidates, audit, lifecycle.
                    </p>
                </div>

                <div className="flex flex-col gap-3" style={{ width: 340, flexShrink: 0 }}>
                    <div>
                        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 5 }}>Status</div>
                        <Select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                        >
                            {STATUSES.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 5 }}>Search</div>
                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                        >
                            <Search size={14} style={{ color: "var(--t3)", flexShrink: 0 }} />
                            <input
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="Search election name…"
                                style={{ background: "transparent", border: "none", color: "var(--t1)", fontSize: 13, outline: "none", flex: 1 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ErrorBanner error={error} onClose={() => setError(null)} />

            <Panel className="animate-up-2" noPad>
                {loading ? (
                    <Spinner text="Loading elections…" />
                ) : filtered.length === 0 ? (
                    <EmptyState icon="📂" title="No elections found"
                                subtitle={`No ${status} elections for your organization${q ? " matching your search" : ""}.`} />
                ) : (
                    <div className="grid grid-cols-3 gap-4 p-4">
                        {filtered.map(e => (
                            <button
                                key={e.id}
                                onClick={() => openElection(e)}
                                className="text-left rounded-xl p-4 transition-all"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                                onMouseEnter={ev => { ev.currentTarget.style.background = "var(--surface-3)"; ev.currentTarget.style.borderColor = "rgba(124,111,247,.3)"; }}
                                onMouseLeave={ev => { ev.currentTarget.style.background = "var(--surface-2)"; ev.currentTarget.style.borderColor = "var(--border)"; }}
                            >
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--t1)", marginBottom: 6 }}>
                                    {e.name || "Election"}
                                </div>
                                <div style={{ fontSize: 11.5, color: "var(--t3)", marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                    {e.description || "No description"}
                                </div>
                                <div className="flex items-center justify-between">
                                    <StatusPill status={e.status || status} />
                                    <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>
                    {String(e.id).slice(0, 8)}
                  </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </Panel>
        </AdminLayout>
    );
}
