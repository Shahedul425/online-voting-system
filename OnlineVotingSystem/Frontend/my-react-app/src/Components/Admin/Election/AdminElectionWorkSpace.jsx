// src/Components/Admin/Election/AdminElectionWorkspace.jsx
// src/Components/Admin/Election/AdminElectionWorkSpace.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Settings2, Upload, Users, UserCheck, FileSearch,
    PlayCircle, PauseCircle, StopCircle, Lock, Megaphone,
    Loader2, RefreshCcw, CalendarClock, BarChart3, ShieldCheck,
} from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { withUnwrap } from "../../../Service/Api/apiUnwrap";
import AdminLayout from "../../../components/layout/AdminLayout";
import {
    Panel, ErrorBanner, Spinner, StatusPill, Btn, InfoRow, HintBox, Chip,
} from "../../ui";

const STATUSES = ["draft", "running", "stopped", "closed", "published"];

function normalizeStatus(s) {
    const x = String(s || "").toLowerCase();
    return STATUSES.includes(x) ? x : "draft";
}

function computeAllowed(status) {
    const s = normalizeStatus(status);
    return {
        canUpdate:  s === "draft",
        canUpload:  s === "draft",
        canStart:   s === "draft" || s === "stopped",
        canStop:    s === "running",
        canClose:   s === "running" || s === "stopped",
        canPublish: s === "closed",
    };
}

function timeHint(e) {
    const now   = Date.now();
    const start = e?.startTime ? Date.parse(e.startTime) : NaN;
    const end   = e?.endTime   ? Date.parse(e.endTime)   : NaN;
    if (isNaN(start) || isNaN(end)) return null;
    if (now < start) return { type: "warn", text: "Start time is in the future. Starting now may be rejected by backend." };
    if (now > end)   return { type: "warn", text: "End time has passed. Starting may be rejected." };
    return { type: "ok", text: "Time window looks OK." };
}

const LIFECYCLE_STEPS = ["draft", "running", "stopped", "closed", "published"];

export default function AdminElectionWorkspace() {
    const navigate       = useNavigate();
    const { electionId } = useParams();
    const me             = useAppStore(s => s.me);
    const adminElection  = useAppStore(s => s.election);
    const setAdminElection = useAppStore(s => s.setElection);

    const [loading, setLoading]     = useState(true);
    const [busyAction, setBusyAction] = useState("");
    const [error, setError]         = useState(null);
    const [election, setElection]   = useState(() =>
        adminElection?.id && String(adminElection.id) === String(electionId) ? adminElection : null
    );

    const orgId  = me?.organizationId || me?.organization?.id;
    const status = normalizeStatus(election?.status);
    const allowed = useMemo(() => computeAllowed(status), [status]);
    const hint    = useMemo(() => election ? timeHint(election) : null, [election]);

    async function loadElection() {
        if (!electionId) return;
        setError(null); setLoading(true);
        try {
            const e = await withUnwrap(OVS.getElectionById({ id: electionId }));
            setElection(e); setAdminElection(e);
        } catch (err) {
            setError(toAppError(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadElection(); }, [electionId]);

    async function runAction(kind) {
        setError(null);
        if (!election?.id) return;
        setBusyAction(kind);
        try {
            if (kind === "start")   await withUnwrap(OVS.startElection({ id: election.id }));
            if (kind === "stop")    await withUnwrap(OVS.stopElection({ id: election.id }));
            if (kind === "close")   await withUnwrap(OVS.closeElection({ id: election.id }));
            if (kind === "publish") await withUnwrap(OVS.publishElection({ id: election.id }));
            const refreshed = await withUnwrap(OVS.getElectionById({ id: election.id }));
            setElection(refreshed); setAdminElection(refreshed);
        } catch (err) {
            setError(toAppError(err));
        } finally {
            setBusyAction("");
        }
    }

    const voterUploaded     = election?.voterListUploaded     ?? election?.isVoterListUploaded     ?? false;
    const candidateUploaded = election?.candidateListUploaded ?? election?.isCandidateListUploaded ?? false;

    const ACTION_CARDS = [
        { key: "update",     icon: Settings2,  title: "Update Election",      sub: "Edit name, description, times",    enabled: allowed.canUpdate,  warn: "Draft only",  path: `/admin/elections/${electionId}/update` },
        { key: "uploadV",    icon: Upload,     title: "Upload Voters CSV",    sub: "Import voter list",                 enabled: allowed.canUpload,  warn: "Draft only",  path: `/admin/elections/${electionId}/uploads/voters` },
        { key: "uploadC",    icon: Upload,     title: "Upload Candidates CSV",sub: "Import candidate list",             enabled: allowed.canUpload,  warn: "Draft only",  path: `/admin/elections/${electionId}/uploads/candidates` },
        { key: "audit",      icon: FileSearch, title: "Audit Logs",           sub: "Search & inspect events",           enabled: true,               warn: null,          path: `/admin/elections/${electionId}/audit` },
        { key: "voters",     icon: Users,      title: "Voter List",           sub: "View eligible/voted/blocked voters",enabled: true,               warn: null,          path: `/admin/elections/${electionId}/voters` },
        { key: "candidates", icon: UserCheck,  title: "Candidate List",       sub: "View candidates & ballot serials",  enabled: true,               warn: null,          path: `/admin/elections/${electionId}/candidates` },
        { key: "results",    icon: BarChart3,  title: "Results / Summary",    sub: "Winners, turnout, Merkle commitment",enabled: status === "published", warn: "Published only", path: `/admin/elections/${electionId}/results` },
    ];

    const LIFECYCLE_BTNS = [
        { key: "start",   label: "Start",   Icon: PlayCircle,  enabled: allowed.canStart,   hint: "Draft or stopped → running" },
        { key: "stop",    label: "Stop",    Icon: StopCircle,  enabled: allowed.canStop,    hint: "Running → stopped" },
        { key: "close",   label: "Close",   Icon: Lock,        enabled: allowed.canClose,   hint: "Running or stopped → closed" },
        { key: "publish", label: "Publish", Icon: Megaphone,   enabled: allowed.canPublish, hint: "Closed only → published" },
    ];

    // lifecycle step index for visual
    const lcIndex = LIFECYCLE_STEPS.indexOf(status);

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin", path: "/admin" },
                { label: "Elections", path: "/admin/elections/status?status=draft" },
                { label: loading ? "…" : (election?.name || electionId) },
                { label: "Workspace" },
            ]}
            topbarRight={
                <Btn variant="ghost" size="sm" loading={loading} onClick={loadElection}>
                    {loading ? null : <RefreshCcw size={12} />} Refresh
                </Btn>
            }
        >
            {/* Election header */}
            {loading ? (
                <Spinner text="Loading election…" />
            ) : (
                <>
                    <div
                        className="rounded-xl p-5 flex items-start justify-between gap-4 animate-up"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck size={14} style={{ color: "var(--purple)" }} />
                                <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Election Workspace</span>
                            </div>
                            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>
                                {election?.name || "Election"}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <StatusPill status={status} />
                                <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>
                  {election?.id || electionId}
                </span>
                            </div>
                            {election?.description && (
                                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 8, maxWidth: 500, lineHeight: 1.6 }}>
                                    {election.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Time hint */}
                    {hint && (
                        <HintBox type={hint.type === "ok" ? "success" : "warning"} className="animate-up">
              <span className="flex items-center gap-2">
                <CalendarClock size={13} style={{ flexShrink: 0 }} />
                <strong>Schedule check:</strong> {hint.text}
              </span>
                        </HintBox>
                    )}

                    <ErrorBanner error={error} onClose={() => setError(null)} />

                    <div className="grid gap-3 animate-up-2" style={{ gridTemplateColumns: "1fr 260px" }}>
                        {/* Left: workspace + lifecycle */}
                        <div className="flex flex-col gap-3">

                            {/* Lifecycle visual */}
                            <Panel title="Election Lifecycle" subtitle="draft → running → stopped → closed → published">
                                <div className="flex items-center gap-0 px-2 py-2">
                                    {LIFECYCLE_STEPS.map((step, i) => {
                                        const state = i < lcIndex ? "done" : i === lcIndex ? "active" : "pending";
                                        return (
                                            <div key={step} className="flex items-center flex-1 min-w-0">
                                                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold border-2"
                                                        style={{
                                                            background: state === "done" ? "var(--green-d)" : state === "active" ? "var(--purple-d)" : "transparent",
                                                            borderColor: state === "done" ? "var(--green)" : state === "active" ? "var(--purple)" : "var(--t3)",
                                                            color: state === "done" ? "var(--green)" : state === "active" ? "var(--purple)" : "var(--t3)",
                                                        }}
                                                    >
                                                        {state === "done" ? "✓" : "○"}
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: 9.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                                                            color: state === "done" ? "var(--green)" : state === "active" ? "var(--purple)" : "var(--t3)",
                                                        }}
                                                    >
                            {step}
                          </span>
                                                </div>
                                                {i < LIFECYCLE_STEPS.length - 1 && (
                                                    <div className="flex-1 h-px mx-2" style={{ background: i < lcIndex ? "rgba(77,202,136,.4)" : "var(--border)" }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Lifecycle action buttons */}
                                <div className="grid grid-cols-4 gap-2.5 mt-2">
                                    {LIFECYCLE_BTNS.map(b => {
                                        const Icon = b.Icon;
                                        const busy = busyAction === b.key;
                                        return (
                                            <button
                                                key={b.key}
                                                disabled={!b.enabled || !!busyAction}
                                                onClick={() => runAction(b.key)}
                                                title={b.hint}
                                                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-semibold transition-all"
                                                style={{
                                                    fontSize: 12,
                                                    border: "1px solid",
                                                    borderColor: b.enabled ? "var(--purple-b)" : "var(--border)",
                                                    background:  b.enabled ? "var(--purple-d)" : "transparent",
                                                    color:       b.enabled ? "var(--purple)"   : "var(--t3)",
                                                    opacity: (!b.enabled || busyAction) ? .5 : 1,
                                                    cursor: b.enabled && !busyAction ? "pointer" : "not-allowed",
                                                }}
                                            >
                                                {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
                                                {b.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 10 }}>
                                    Current: <strong style={{ color: "var(--t1)" }}>{status.toUpperCase()}</strong>
                                    {status === "draft"     && " · Upload lists, update details, then start when ready."}
                                    {status === "running"   && " · You can stop or close."}
                                    {status === "stopped"   && " · You can start again or close."}
                                    {status === "closed"    && " · You can publish now."}
                                    {status === "published" && " · Read-only."}
                                </p>
                            </Panel>

                            {/* Action cards grid */}
                            <Panel title="Workspace Actions">
                                <div className="grid grid-cols-2 gap-2.5">
                                    {ACTION_CARDS.map(ac => {
                                        const Icon = ac.icon;
                                        return (
                                            <button
                                                key={ac.key}
                                                disabled={!ac.enabled}
                                                onClick={() => ac.enabled && navigate(ac.path)}
                                                className="text-left rounded-xl p-3.5 transition-all"
                                                style={{
                                                    background: ac.enabled ? "var(--surface-2)" : "rgba(255,255,255,.02)",
                                                    border: `1px solid ${ac.enabled ? "var(--border)" : "var(--border)"}`,
                                                    opacity: ac.enabled ? 1 : .5,
                                                    cursor: ac.enabled ? "pointer" : "not-allowed",
                                                }}
                                                onMouseEnter={ev => { if (ac.enabled) { ev.currentTarget.style.borderColor = "var(--purple-b)"; ev.currentTarget.style.background = "var(--purple-d)"; } }}
                                                onMouseLeave={ev => { ev.currentTarget.style.borderColor = "var(--border)"; ev.currentTarget.style.background = ac.enabled ? "var(--surface-2)" : "rgba(255,255,255,.02)"; }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                         style={{ background: "var(--surface-3)", color: "var(--t2)", border: "1px solid var(--border)" }}>
                                                        <Icon size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{ac.title}</div>
                                                        <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{ac.sub}</div>
                                                        {!ac.enabled && ac.warn && (
                                                            <div style={{ fontSize: 10.5, color: "var(--orange)", marginTop: 4 }}>⚠ {ac.warn}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Panel>
                        </div>

                        {/* Right: summary */}
                        <Panel title="Summary">
                            <InfoRow label="Start"       value={election?.startTime ? new Date(election.startTime).toLocaleString() : "—"} />
                            <InfoRow label="End"         value={election?.endTime   ? new Date(election.endTime).toLocaleString()   : "—"} />
                            <InfoRow label="Created by"  value={election?.createdBy?.email || election?.createdBy?.id || "—"} />
                            <InfoRow label="Merkle root" value={election?.merkleRoot ? `${String(election.merkleRoot).slice(0,12)}…` : "—"} mono />

                            {/* Uploads status */}
                            <div style={{ marginTop: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 8 }}>
                                    Uploads
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Chip variant={voterUploaded     ? "green" : "red"}>{voterUploaded     ? "Voters ✓" : "Voters ✗"}</Chip>
                                    <Chip variant={candidateUploaded ? "green" : "red"}>{candidateUploaded ? "Candidates ✓" : "Candidates ✗"}</Chip>
                                </div>
                            </div>

                            {/* What's allowed */}
                            <div style={{ marginTop: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 8 }}>
                                    Allowed now
                                </div>
                                <ul className="flex flex-col gap-1.5" style={{ listStyle: "none" }}>
                                    {[
                                        ["Update election",        allowed.canUpdate],
                                        ["Upload voters/candidates", allowed.canUpload],
                                        ["Start election",          allowed.canStart],
                                        ["Stop election",           allowed.canStop],
                                        ["Close election",          allowed.canClose],
                                        ["Publish election",        allowed.canPublish],
                                    ].map(([label, ok]) => (
                                        ok && (
                                            <li key={label} style={{ fontSize: 11.5, color: "var(--green)" }}>✓ {label}</li>
                                        )
                                    ))}
                                    {!Object.values(allowed).some(Boolean) && (
                                        <li style={{ fontSize: 11.5, color: "var(--t3)" }}>Read-only</li>
                                    )}
                                </ul>
                            </div>

                            <p style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 12, lineHeight: 1.6 }}>
                                UI enforces status rules, but backend is always the source of truth.
                            </p>
                        </Panel>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
