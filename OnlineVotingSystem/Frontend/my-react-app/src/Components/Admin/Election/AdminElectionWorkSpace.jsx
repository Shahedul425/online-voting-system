// src/Components/Admin/Election/AdminElectionWorkspace.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Settings2,
    Upload,
    Users,
    UserCheck,
    FileSearch,
    PlayCircle,
    PauseCircle,
    StopCircle,
    Lock,
    Megaphone,
    Loader2,
    RefreshCcw,
    CalendarClock,
    ShieldCheck,
} from "lucide-react";

import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import { withUnwrap } from "../../../Service/Api/apiUnwrap";

// ===== Helpers =====
const STATUSES = ["draft", "running", "stopped", "closed", "published"];

function normalizeStatus(s) {
    const x = String(s || "").toLowerCase();
    return STATUSES.includes(x) ? x : "draft";
}

function statusBadgeClasses(status) {
    const s = normalizeStatus(status);
    if (s === "running") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    if (s === "stopped") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    if (s === "closed") return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    if (s === "published") return "border-purple-500/20 bg-purple-500/10 text-purple-200";
    return "border-white/10 bg-white/5 text-white/70"; // draft
}

function computeAllowedActions(status) {
    const s = normalizeStatus(status);

    // Business rules (as you said):
    // - Only closed can publish
    // - draft: can update, can upload lists, can start (if time ok), can close? usually no, but you have API; we'll keep close available only if not published.
    // - running: can stop, can close
    // - stopped: can start, can close
    // - closed: can publish
    // - published: no lifecycle actions

    return {
        canUpdate: s === "draft",
        canUpload: s === "draft",
        canStart: s === "draft" || s === "stopped",
        canStop: s === "running",
        canClose: s === "running" || s === "stopped",
        canPublish: s === "closed",
        readonly: s === "published" || s === "closed" || s === "running" || s === "stopped",
    };
}

// Soft “time check” UI (backend should still enforce)
function timeHint(e) {
    const now = Date.now();
    const start = e?.startTime ? Date.parse(e.startTime) : NaN;
    const end = e?.endTime ? Date.parse(e.endTime) : NaN;

    if (Number.isNaN(start) || Number.isNaN(end)) return null;

    if (now < start) return { type: "warn", text: "Start time is in the future. Starting now may be rejected by backend." };
    if (now > end) return { type: "warn", text: "End time has passed. Starting may be rejected." };
    return { type: "ok", text: "Time window looks OK." };
}

export default function AdminElectionWorkspace() {
    const navigate = useNavigate();
    const { electionId } = useParams();

    const me = useAppStore((s) => s.me);
    const adminElection = useAppStore((s) => s.election);
    const setAdminElection = useAppStore((s) => s.setElection);

    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState(""); // "start" | "stop" | "close" | "publish" | ...
    const [error, setError] = useState(null);

    // Local view of election (prefer fetched, fallback to store)
    const [election, setElection] = useState(() => {
        if (adminElection?.id && String(adminElection.id) === String(electionId)) return adminElection;
        return null;
    });

    const orgId = me?.organizationId || me?.organization?.id;

    const status = normalizeStatus(election?.status);
    const allowed = useMemo(() => computeAllowedActions(status), [status]);

    const hint = useMemo(() => (election ? timeHint(election) : null), [election]);

    // ---- Load election detail (GET by id) ----
    useEffect(() => {
        let alive = true;

        async function load() {
            setError(null);

            if (!electionId) {
                setLoading(false);
                setError(
                    toAppError({
                        status: 400,
                        code: "ELECTION_REQUIRED",
                        message: "Missing electionId in URL.",
                    })
                );
                return;
            }

            setLoading(true);
            try {
                const e = await withUnwrap(OVS.getElectionById({ id: electionId }));

                // Optional: ensure org matches logged-in admin
                const eOrgId = e?.organization?.id || e?.organizationId;
                if (orgId && eOrgId && String(orgId) !== String(eOrgId)) {
                    throw {
                        status: 403,
                        code: "ORG_MISMATCH",
                        message: "You cannot access an election from a different organization.",
                    };
                }

                if (!alive) return;
                setElection(e);
                setAdminElection(e); // keep cache
            } catch (err) {
                if (!alive) return;
                setError(toAppError(err));
                setElection(null);
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [electionId, orgId, setAdminElection]);

    // ---- Lifecycle actions ----
    async function runAction(kind) {
        setError(null);

        if (!election?.id) return;

        setBusyAction(kind);
        try {
            if (kind === "start") await withUnwrap(OVS.startElection({ id: election.id }));
            else if (kind === "stop") await withUnwrap(OVS.stopElection({ id: election.id }));
            else if (kind === "close") await withUnwrap(OVS.closeElection({ id: election.id }));
            else if (kind === "publish") await withUnwrap(OVS.publishElection({ id: election.id }));
            else throw { status: 400, message: "Unknown action" };

            // refresh election after action
            const refreshed = await withUnwrap(OVS.getElectionById({ id: election.id }));
            setElection(refreshed);
            setAdminElection(refreshed);
        } catch (err) {
            setError(toAppError(err));
        } finally {
            setBusyAction("");
        }
    }

    const showActionDisabledReason = (kind) => {
        if (!election) return "Election not loaded.";
        if (kind === "publish" && status !== "closed") return "Only closed elections can be published.";
        if (kind === "upload" && status !== "draft") return "Uploads are allowed only in draft.";
        if (kind === "update" && status !== "draft") return "Updates are allowed only in draft.";
        if (kind === "stop" && status !== "running") return "Only running elections can be stopped.";
        if (kind === "start" && !(status === "draft" || status === "stopped")) return "Only draft/stopped elections can be started.";
        if (kind === "close" && !(status === "running" || status === "stopped")) return "Only running/stopped elections can be closed.";
        if (status === "published") return "Published elections are read-only.";
        return "Not available for this status.";
    };

    // ---- Navigation helpers ----
    const go = {
        update: () => navigate(`/admin/elections/${electionId}/update`),
        voters: () => navigate(`/admin/elections/${electionId}/voters`),
        candidates: () => navigate(`/admin/elections/${electionId}/candidates`),
        audit: () => navigate(`/admin/elections/${electionId}/audit`),
        uploadVoters: () => navigate(`/admin/elections/${electionId}/uploads/voters`),
        uploadCandidates: () => navigate(`/admin/elections/${electionId}/uploads/candidates`),
    };

    // If you don't have an "update" page yet, the Update button still helps: you can wire it later.

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-6xl">
                {/* Top back */}
                <button
                    onClick={() => navigate("/admin/elections")}
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Elections
                </button>

                {/* Header */}
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <ShieldCheck className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Admin • Election Workspace</span>
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight truncate">
                            {loading ? "Loading…" : election?.name || "Election"}
                        </h1>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/60">
              <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", statusBadgeClasses(status)].join(" ")}>
                {status.toUpperCase()}
              </span>

                            <span className="text-xs text-white/40 font-mono">
                {election?.id || electionId}
              </span>
                        </div>

                        {election?.description ? (
                            <p className="mt-3 text-sm text-white/60 max-w-3xl line-clamp-2">{election.description}</p>
                        ) : null}

                        {hint ? (
                            <div
                                className={[
                                    "mt-4 rounded-2xl border px-4 py-3 text-sm",
                                    hint.type === "ok"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-100",
                                ].join(" ")}
                            >
                                <div className="flex items-start gap-2">
                                    <CalendarClock className="h-4 w-4 mt-0.5" />
                                    <div className="min-w-0">
                                        <div className="font-semibold">Schedule check</div>
                                        <div className="mt-1 text-sm opacity-90">{hint.text}</div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button
                        onClick={async () => {
                            if (!electionId) return;
                            setError(null);
                            setLoading(true);
                            try {
                                const e = await withUnwrap(OVS.getElectionById({ id: electionId }));
                                setElection(e);
                                setAdminElection(e);
                            } catch (err) {
                                setError(toAppError(err));
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                {/* Main */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Actions */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-white/80">Workspace</div>
                            <div className="text-xs text-white/40">
                                Status-driven actions (draft → running/stopped → closed → published)
                            </div>
                        </div>

                        {/* Primary action row */}
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Update */}
                            <ActionCard
                                icon={<Settings2 className="h-5 w-5" />}
                                title="Update election"
                                subtitle={allowed.canUpdate ? "Edit name, description, times." : "Only available in draft."}
                                tone={allowed.canUpdate ? "primary" : "disabled"}
                                disabled={!allowed.canUpdate}
                                disabledReason={showActionDisabledReason("update")}
                                onClick={go.update}
                            />

                            {/* Upload voters */}
                            <ActionCard
                                icon={<Upload className="h-5 w-5" />}
                                title="Upload voters CSV"
                                subtitle={allowed.canUpload ? "Import and validate voters for this election." : "Uploads are draft-only."}
                                tone={allowed.canUpload ? "primary" : "disabled"}
                                disabled={!allowed.canUpload}
                                disabledReason={showActionDisabledReason("upload")}
                                onClick={go.uploadVoters}
                            />

                            {/* Upload candidates */}
                            <ActionCard
                                icon={<Upload className="h-5 w-5" />}
                                title="Upload candidates CSV"
                                subtitle={allowed.canUpload ? "Import candidates into staging." : "Uploads are draft-only."}
                                tone={allowed.canUpload ? "primary" : "disabled"}
                                disabled={!allowed.canUpload}
                                disabledReason={showActionDisabledReason("upload")}
                                onClick={go.uploadCandidates}
                            />

                            {/* Audit */}
                            <ActionCard
                                icon={<FileSearch className="h-5 w-5" />}
                                title="Audit logs"
                                subtitle="Search & open a single audit record (election-scoped)."
                                tone="neutral"
                                disabled={!electionId}
                                disabledReason="Election not loaded."
                                onClick={go.audit}
                            />

                            {/* Voters list */}
                            <ActionCard
                                icon={<Users className="h-5 w-5" />}
                                title="Voter list"
                                subtitle="View eligible/voted/blocked voters for this election."
                                tone="neutral"
                                disabled={!electionId}
                                disabledReason="Election not loaded."
                                onClick={go.voters}
                            />

                            {/* Candidate list */}
                            <ActionCard
                                icon={<UserCheck className="h-5 w-5" />}
                                title="Candidate list"
                                subtitle="View all candidates and their ballot serial."
                                tone="neutral"
                                disabled={!electionId}
                                disabledReason="Election not loaded."
                                onClick={go.candidates}
                            />
                        </div>

                        {/* Lifecycle */}
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-white/80">Lifecycle</div>
                                <div className="text-xs text-white/40">
                                    Only <span className="font-semibold">CLOSED</span> elections can be published.
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <LifecycleButton
                                    icon={<PlayCircle className="h-4 w-4" />}
                                    label="Start"
                                    onClick={() => runAction("start")}
                                    loading={busyAction === "start"}
                                    disabled={!allowed.canStart}
                                    hint={showActionDisabledReason("start")}
                                />
                                <LifecycleButton
                                    icon={<StopCircle className="h-4 w-4" />}
                                    label="Stop"
                                    onClick={() => runAction("stop")}
                                    loading={busyAction === "stop"}
                                    disabled={!allowed.canStop}
                                    hint={showActionDisabledReason("stop")}
                                />
                                <LifecycleButton
                                    icon={<Lock className="h-4 w-4" />}
                                    label="Close"
                                    onClick={() => runAction("close")}
                                    loading={busyAction === "close"}
                                    disabled={!allowed.canClose}
                                    hint={showActionDisabledReason("close")}
                                />
                                <LifecycleButton
                                    icon={<Megaphone className="h-4 w-4" />}
                                    label="Publish"
                                    onClick={() => runAction("publish")}
                                    loading={busyAction === "publish"}
                                    disabled={!allowed.canPublish}
                                    hint={showActionDisabledReason("publish")}
                                />
                            </div>

                            {/* status notes */}
                            <div className="mt-4 text-xs text-white/45">
                                Current: <span className="font-semibold text-white/70">{status.toUpperCase()}</span>.
                                {status === "draft" ? " Upload lists, update details, then start when ready." : null}
                                {status === "running" ? " You can stop or close." : null}
                                {status === "stopped" ? " You can start again or close." : null}
                                {status === "closed" ? " You can publish now." : null}
                                {status === "published" ? " Read-only." : null}
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                        <div className="text-sm font-semibold text-white/80">Summary</div>

                        {loading ? (
                            <div className="mt-6 flex items-center gap-2 text-white/70">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                Loading…
                            </div>
                        ) : !election ? (
                            <div className="mt-6 text-sm text-white/50">No election loaded.</div>
                        ) : (
                            (() => {
                                const voterUploaded =
                                    election?.voterListUploaded ?? election?.isVoterListUploaded ?? false;

                                const candidateUploaded =
                                    election?.candidateListUploaded ?? election?.isCandidateListUploaded ?? false;

                                const Pill = ({ok, label}) => (
                                    <span
                                        className={[
                                            "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold border",
                                            ok
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                                : "border-red-500/20 bg-red-500/10 text-red-200",
                                        ].join(" ")}
                                    >{label}
                                    </span>
                                );

                                return (
                                    <div className="mt-6 space-y-3 text-sm">
                                        {/*<InfoRow label="Status"*/}
                                        {/*         value={String(election?.status || status || "—").toUpperCase()}/>*/}

                                        <InfoRow
                                            label="Start"
                                            value={election.startTime ? new Date(election.startTime).toLocaleString() : "—"}
                                        />
                                        <InfoRow
                                            label="End"
                                            value={election.endTime ? new Date(election.endTime).toLocaleString() : "—"}
                                        />

                                        {/* NEW: Created by */}
                                        <InfoRow
                                            label="Created by"
                                            value={election?.createdBy?.email || election?.createdBy?.id || "—"}
                                        />

                                        {/* NEW: Org name (not ID) */}
                                        {/*<InfoRow*/}
                                        {/*    label="Organization"*/}
                                        {/*    value={election?.organization?.name || "—"}*/}
                                        {/*/>*/}

                                        {/* NEW: Upload pills (compact) */}
                                        <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3">
                                            <div className="text-xs text-white/50">Uploads</div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Pill ok={voterUploaded}
                                                      label={voterUploaded ? "Voters ✅" : "Voters ❌"}/>
                                                <Pill ok={candidateUploaded}
                                                      label={candidateUploaded ? "Candidates ✅" : "Candidates ❌"}/>
                                            </div>
                                        </div>

                                        {/* NEW: Merkle root */}
                                        <InfoRow label="Merkle root" value={election?.merkleRoot || "—"} mono/>

                                        {/* Keep your existing block */}
                                        <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3">
                                            <div className="text-xs text-white/50">What’s allowed now?</div>
                                            <ul className="mt-2 space-y-1 text-xs text-white/70 list-disc pl-5">
                                                {allowed.canUpdate ? <li>Update election</li> : null}
                                                {allowed.canUpload ? <li>Upload voters/candidates</li> : null}
                                                {allowed.canStart ? <li>Start election</li> : null}
                                                {allowed.canStop ? <li>Stop election</li> : null}
                                                {allowed.canClose ? <li>Close election</li> : null}
                                                {allowed.canPublish ? <li>Publish election</li> : null}
                                                {!allowed.canUpdate &&
                                                !allowed.canUpload &&
                                                !allowed.canStart &&
                                                !allowed.canStop &&
                                                !allowed.canClose &&
                                                !allowed.canPublish ? <li>Read-only</li> : null}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                </div>

                {/* Footer note */}
                <div className="mt-6 text-center text-xs text-white/35">
                    This page enforces UI rules by status, but backend is still the source of truth.
                </div>
            </div>
        </div>
    );
}

// ===== UI Bits =====
function ActionCard({icon, title, subtitle, onClick, disabled, disabledReason, tone = "neutral"}) {
    const base =
        "w-full rounded-2xl border p-4 text-left transition";
    const styles =
        tone === "primary"
            ? "border-indigo-400/20 bg-indigo-500/10 hover:border-indigo-400/40 hover:bg-indigo-500/15"
            : tone === "disabled"
                ? "border-white/10 bg-zinc-900/30 opacity-60 cursor-not-allowed"
                : "border-white/10 bg-zinc-900/30 hover:border-indigo-400/30 hover:bg-zinc-900/45";

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            className={[base, styles].join(" ")}
            title={disabled ? disabledReason : ""}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-white/10 bg-white/5 p-2">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90">{title}</div>
                    <div className="mt-1 text-xs text-white/55">{subtitle}</div>
                    {disabled && disabledReason ? (
                        <div className="mt-2 text-xs text-amber-300/90">{disabledReason}</div>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

function LifecycleButton({icon, label, onClick, disabled, loading, hint}) {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            onClick={onClick}
            title={disabled ? hint : ""}
            className={[
                "rounded-xl border px-4 py-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2",
                disabled
                    ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                    : "border-indigo-400/20 bg-indigo-500/10 hover:border-indigo-400/40 hover:bg-indigo-500/15",
            ].join(" ")}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : icon}
            {label}
        </button>
    );
}

function InfoRow({label, value, mono}) {
    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3">
            <div className="text-xs text-white/50">{label}</div>
            <div className={["mt-1 text-sm text-white/80", mono ? "font-mono text-xs break-all" : ""].join(" ")}>
                {value}
            </div>
        </div>
    );
}
