import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ShieldCheck,
    Loader2,
    Search,
    ArrowLeft,
    User,
    Building2,
    Fingerprint,
    CalendarClock,
} from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";

function toIsoOrNull(datetimeLocalValue) {
    if (!datetimeLocalValue) return null;
    try {
        const d = new Date(datetimeLocalValue);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
    } catch {
        return null;
    }
}

function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v) {
    return uuidRegex.test((v || "").trim());
}

function statusPill(s) {
    const v = String(s || "").toUpperCase();
    const base =
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border";
    if (v === "SUCCESS")
        return `${base} bg-emerald-500/10 text-emerald-200 border-emerald-500/20`;
    if (v === "FAILED")
        return `${base} bg-red-500/10 text-red-200 border-red-500/20`;
    if (v === "REJECTED")
        return `${base} bg-amber-500/10 text-amber-200 border-amber-500/20`;
    return `${base} bg-white/5 text-white/70 border-white/10`;
}

function actionPill() {
    return "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border bg-indigo-500/10 text-indigo-200 border-indigo-400/20";
}

function rolePill(role) {
    const r = String(role || "").toUpperCase();
    const base =
        "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold border";
    if (r === "ADMIN")
        return `${base} bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-500/20`;
    if (r === "SUPERADMIN")
        return `${base} bg-purple-500/10 text-purple-200 border-purple-500/20`;
    if (r === "VOTER")
        return `${base} bg-sky-500/10 text-sky-200 border-sky-500/20`;
    return `${base} bg-white/5 text-white/70 border-white/10`;
}

function smallKV(label, value, Icon) {
    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
                {Icon ? <Icon className="h-3.5 w-3.5 text-white/40" /> : null}
                <span>{label}</span>
            </div>
            <div className="mt-1 text-sm font-semibold break-words">
                {value || "—"}
            </div>
        </div>
    );
}

function monoKV(label, value, Icon) {
    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
                {Icon ? <Icon className="h-3.5 w-3.5 text-white/40" /> : null}
                <span>{label}</span>
            </div>
            <div className="mt-1 font-mono text-xs text-white/75 break-all">
                {value || "—"}
            </div>
        </div>
    );
}

export default function AdminAuditLogs() {
    const navigate = useNavigate();
    const { electionId } = useParams();

    // Filters
    const [actorId, setActorId] = useState("");
    const [action, setAction] = useState("");
    const [status, setStatus] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // Paging
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);

    // Data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Detail
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const actorUuidOrNull = useMemo(
        () => (isUuid(actorId) ? actorId.trim() : null),
        [actorId]
    );

    async function runSearch(nextPage = 0) {
        setError(null);
        setDetail(null);
        setSelectedId(null);

        if (!electionId) {
            setError(
                toAppError({
                    status: 400,
                    code: "NO_ELECTION",
                    message: "Missing electionId in URL.",
                })
            );
            return;
        }

        const payload = {
            electionId,
            actorId: actorUuidOrNull,
            action: action.trim() || null,
            status: status.trim() || null,
            from: toIsoOrNull(from),
            to: toIsoOrNull(to),
            page: nextPage,
            size: Number(size) || 20,
            sortBy: "createdAt",
            direction: "DESC",
        };

        setLoading(true);
        const res = await OVS.auditSearch(payload);
        setLoading(false);

        if (!res.ok) {
            setError(toAppError(res));
            return;
        }

        setItems(res.data?.content ?? []);
        setTotalPages(res.data?.totalPages ?? 0);
        setTotalElements(res.data?.totalElements ?? 0);
        setPage(res.data?.number ?? nextPage);
    }

    async function openDetail(auditId, e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        setError(null);
        setSelectedId(auditId);
        setDetail(null);

        setDetailLoading(true);
        const res = await OVS.auditGetOne({ electionId, auditId });
        setDetailLoading(false);

        if (!res.ok) {
            setError(toAppError(res));
            return;
        }

        setDetail(res.data);
    }

    useEffect(() => {
        if (electionId) runSearch(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    // pagination buttons: show 1..N (max 7)
    const pageButtons = useMemo(() => {
        const tp = totalPages || 0;
        if (tp <= 1) return [0];
        const cur = page;
        const max = 7;

        let start = Math.max(0, cur - 3);
        let end = Math.min(tp - 1, start + (max - 1));
        start = Math.max(0, end - (max - 1));

        const arr = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
    }, [page, totalPages]);

    // Safe helpers for detail object
    const actor = detail?.actor;
    const org = detail?.organization ?? actor?.organization ?? detail?.election?.organization;
    const election = detail?.election;

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-7xl">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <ShieldCheck className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Admin • Audit Logs</span>
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
                            Audit
                        </h1>
                        <p className="mt-2 text-sm text-white/60">
                            Election: <span className="font-mono">{electionId || "—"}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => runSearch(0)}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 transition disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Search
                    </button>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                {/* Filters */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <label className="text-xs text-white/60">Actor ID (UUID)</label>
                            <input
                                value={actorId}
                                onChange={(e) => setActorId(e.target.value)}
                                placeholder="optional"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            />
                            {actorId && !isUuid(actorId) ? (
                                <p className="mt-2 text-xs text-amber-300">
                                    Must be a valid UUID.
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <label className="text-xs text-white/60">Action</label>
                            <input
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                placeholder="e.g. VOTE_CAST"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-white/60">Status</label>
                            <input
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                placeholder="SUCCESS / FAILED"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-white/60">From</label>
                            <input
                                type="datetime-local"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-white/60">To</label>
                            <input
                                type="datetime-local"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-white/50">
                            Total:{" "}
                            <span className="font-semibold text-white/70">
                {totalElements}
              </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-xs text-white/60">Size</div>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="w-24 rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            />
                        </div>
                    </div>
                </div>

                {/* List + Detail */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* LIST */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-16 text-white/70">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Loading audit logs...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-12 text-center text-white/60">
                                No audit records.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-xs text-white/50">
                                    <tr className="border-b border-white/10">
                                        <th className="py-3 pr-4">When</th>
                                        <th className="py-3 pr-4">Action</th>
                                        <th className="py-3 pr-4">Status</th>
                                        <th className="py-3 pr-4">Details</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                    {items.map((a) => {
                                        const active = selectedId === a.id;
                                        return (
                                            <tr
                                                key={a.id}
                                                className={[
                                                    "cursor-pointer transition",
                                                    active ? "bg-indigo-500/10" : "hover:bg-white/5",
                                                ].join(" ")}
                                                onClick={(e) => openDetail(a.id, e)}
                                                title="Click to view details"
                                            >
                                                <td className="py-3 pr-4 text-white/70">
                                                    {fmtDate(a.createdAt)}
                                                </td>
                                                <td className="py-3 pr-4">
                            <span className={actionPill()}>
                              {a.action || "—"}
                            </span>
                                                </td>
                                                <td className="py-3 pr-4">
                            <span className={statusPill(a.status)}>
                              {a.status || "—"}
                            </span>
                                                </td>
                                                <td className="py-3 pr-4 text-white/80">
                                                    <div className="line-clamp-1">
                                                        {a.details || "—"}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-white/40 font-mono">
                                                        {String(a.id).slice(0, 8)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-white/50">
                            <div>
                                Page{" "}
                                <span className="text-white/70 font-semibold">{page + 1}</span>{" "}
                                /{" "}
                                <span className="text-white/70 font-semibold">
                  {Math.max(totalPages, 1)}
                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => runSearch(Math.max(page - 1, 0))}
                                    disabled={loading || page <= 0}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                {pageButtons.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => runSearch(p)}
                                        disabled={loading}
                                        className={[
                                            "rounded-lg border px-3 py-2",
                                            p === page
                                                ? "border-indigo-400/40 bg-indigo-500/10 text-white"
                                                : "border-white/10 bg-white/5 hover:bg-white/10",
                                        ].join(" ")}
                                    >
                                        {p + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() =>
                                        runSearch(Math.min(page + 1, Math.max(totalPages - 1, 0)))
                                    }
                                    disabled={loading || page >= totalPages - 1}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DETAIL */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur h-fit lg:sticky lg:top-6">
                        <div className="text-sm font-semibold text-white/80">
                            Audit Detail
                        </div>

                        {!selectedId ? (
                            <div className="mt-4 text-sm text-white/50">
                                Click a row to view details.
                            </div>
                        ) : detailLoading ? (
                            <div className="mt-4 flex items-center gap-2 text-white/70">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading detail...
                            </div>
                        ) : !detail ? (
                            <div className="mt-4 text-sm text-white/50">No detail loaded.</div>
                        ) : (
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={actionPill()}>{detail.action || "—"}</span>
                                    <span className={statusPill(detail.status)}>
                    {detail.status || "—"}
                  </span>
                                </div>

                                {/* Useful summary grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    {smallKV("Created", fmtDate(detail.createdAt), CalendarClock)}
                                    {monoKV("Audit ID", detail.id || selectedId, Fingerprint)}
                                </div>

                                {/* Actor card */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                                        <User className="h-4 w-4 text-indigo-300" />
                                        Actor
                                        <span className={rolePill(actor?.role)}>{actor?.role || "—"}</span>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {smallKV("Email", actor?.email || "—")}
                                        {monoKV("Actor ID", actor?.id || "—")}
                                        {/*{monoKV("Keycloak ID", actor?.keycloakId || "—")}*/}
                                        {smallKV("Actor Created At", fmtDate(actor?.createdAt))}
                                    </div>
                                </div>

                                {/* Election card */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                                        <ShieldCheck className="h-4 w-4 text-indigo-300" />
                                        Election
                                        <span className="ml-auto inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold border bg-white/5 text-white/70 border-white/10">
                      {election?.status || "—"}
                    </span>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {smallKV("Name", election?.name || "—")}
                                        {monoKV("Election ID", election?.id || "—")}
                                        {smallKV("Type", election?.electionType || "—")}
                                        {smallKV("Start", fmtDate(election?.startTime))}
                                        {smallKV("End", fmtDate(election?.endTime))}
                                        {monoKV("Merkle Root", election?.merkleRoot || "—")}
                                        {smallKV(
                                            "Candidate List Uploaded",
                                            String(!!election?.candidateListUploaded)
                                        )}
                                        {smallKV(
                                            "Voter List Uploaded",
                                            String(!!election?.voterListUploaded)
                                        )}
                                    </div>
                                </div>

                                {/* Org card */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                                        <Building2 className="h-4 w-4 text-indigo-300" />
                                        Organization
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {smallKV("Name", org?.name || "—")}
                                        {monoKV("Org ID", org?.id || "—")}
                                        {smallKV("Type", org?.type || "—")}
                                        {smallKV("Country", org?.country || "—")}
                                        {smallKV(
                                            "Allowed Domains",
                                            (org?.allowedDomains || []).join(", ") || "—"
                                        )}
                                    </div>
                                </div>

                                {/* Action details */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-semibold text-white/80">
                                        Action Detail
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        {smallKV("Entity ID", detail.entityId || "—")}
                                        {smallKV("Details", detail.details || "—")}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
