"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Search, FolderOpen, ArrowLeft } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

const STATUS = ["draft", "running", "stopped", "closed", "published"];

export default function AdminElectionsByStatus() {
    const navigate = useNavigate();
    const qsp = useQuery();

    const me = useAppStore((s) => s.me);
    const setElection = useAppStore((s) => s.setElection);

    const statusFromUrl = (qsp.get("status") || "draft").toLowerCase();
    const [status, setStatus] = useState(STATUS.includes(statusFromUrl) ? statusFromUrl : "draft");
    const [q, setQ] = useState("");

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const orgId = me?.organizationId || me?.organization?.id;

    useEffect(() => {
        let alive = true;

        async function load() {
            setError(null);
            setLoading(true);

            const res = await OVS.getElectionByStatus({ status,orgId });
            if (!alive) return;

            setLoading(false);
            if (!res.ok) {
                setError(toAppError(res));
                return;
            }

            const list = Array.isArray(res.data) ? res.data : [];

            // optional safety: filter by org if backend ever returns mixed
            const filteredByOrg = orgId
                ? list.filter((e) => {
                    const eid = e?.organization?.id || e?.organizationId;
                    return !eid || String(eid) === String(orgId);
                })
                : list;

            setRows(filteredByOrg);
        }

        load();
        return () => (alive = false);
    }, [status, orgId]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((e) => (e.name || "").toLowerCase().includes(s));
    }, [rows, q]);

    function openElection(e) {
        setElection(e);
        navigate(`/admin/elections/${e.id}`); // workspace
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-6xl">
                <button
                    onClick={() => navigate("/admin")}
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Admin Panel
                </button>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <FolderOpen className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Admin • Elections</span>
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{label(status)}</h1>
                        <p className="mt-2 text-sm text-white/60">
                            Pick an election to open its workspace (uploads, lists, audit, lifecycle).
                        </p>
                    </div>

                    <div className="w-full sm:w-[420px] space-y-3">
                        <div>
                            <label className="text-xs text-white/60">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            >
                                <option value="draft">Draft</option>
                                <option value="running">Running</option>
                                <option value="stopped">Stopped</option>
                                <option value="closed">Closed</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-white/60">Search</label>
                            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                <Search className="h-4 w-4 text-white/50" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search election name..."
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-white/70">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading elections...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-white/60">No elections found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((e) => (
                                <button
                                    key={e.id}
                                    onClick={() => openElection(e)}
                                    className="text-left rounded-2xl border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-indigo-400/30 transition p-5"
                                >
                                    <div className="text-base font-semibold text-white/90">{e.name || "Election"}</div>
                                    <div className="mt-2 text-xs text-white/50 line-clamp-2">
                                        {e.description || "No description"}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                      {(e.status || status || "—").toString()}
                    </span>
                                        <span className="font-mono">{String(e.id).slice(0, 8)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function label(status) {
    const s = String(status || "").toLowerCase();
    if (s === "draft") return "Draft Elections";
    if (s === "running") return "Running Elections";
    if (s === "stopped") return "Stopped Elections";
    if (s === "closed") return "Closed Elections";
    if (s === "published") return "Published Elections";
    return "Elections";
}
