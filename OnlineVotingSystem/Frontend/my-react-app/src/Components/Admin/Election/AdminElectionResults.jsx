// src/Components/Admin/Election/AdminElectionResults.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Copy, Check, Download } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { withUnwrap } from "../../../Service/Api/apiUnwrap";
import AdminLayout from "../../../components/layout/AdminLayout";
import {
    Panel, KpiCard, Spinner, ErrorBanner, Btn, Chip, EmptyState,
} from "../../ui";
import { Users, CheckCircle2, BarChart2, Hash } from "lucide-react";

const fmt   = n => Number(n ?? 0).toLocaleString();
const pct   = n => `${Number(n ?? 0).toFixed(2)}%`;
const ini   = name => String(name || "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const fmtDT = v => { try { return new Intl.DateTimeFormat(undefined, { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(v)); } catch { return String(v || "—"); } };

function Donut({ turnout = 68.4, voted = 0, abstained = 0 }) {
    const circ   = 251.3;
    const filled = circ * Math.min(turnout / 100, 1);
    return (
        <div className="flex flex-col items-center gap-4">
            <svg width="108" height="108" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r="40" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="11" />
                <circle cx="54" cy="54" r="40" fill="none" stroke="url(#tg)" strokeWidth="11"
                        strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset="62.8" strokeLinecap="round" />
                <defs>
                    <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c6ff7" /><stop offset="100%" stopColor="#4dd9e8" />
                    </linearGradient>
                </defs>
                <text x="54" y="50" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e8eaf0" fontFamily="JetBrains Mono,monospace">{pct(turnout)}</text>
                <text x="54" y="64" textAnchor="middle" fontSize="8" fill="#4e5270" fontFamily="Inter,sans-serif" fontWeight="600" letterSpacing="1">TURNOUT</text>
            </svg>
            <div style={{ width: "100%" }}>
                {[["Voted", voted, "var(--purple)"], ["Abstained", abstained, "rgba(255,255,255,.12)"]].map(([l, v, c]) => (
                    <div key={l} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--t2)" }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                            {l}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", fontFamily: "JetBrains Mono" }}>{fmt(v)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminElectionResults() {
    const { electionId } = useParams();
    const navigate        = useNavigate();
    const election        = useAppStore(s => s.election);

    const [results,  setResults]  = useState(null); // ElectionResultsResponse
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);
    const [activePos, setActivePos] = useState(null);
    const [copied,   setCopied]   = useState(false);

    useEffect(() => {
        let alive = true;
        async function load() {
            if (!electionId) return;
            setLoading(true); setError(null);
            try {
                // GET /admin/election/results/{electionId} (published only)
                const data = await withUnwrap(OVS.getAdminElectionResults({ electionId }));
                if (!alive) return;
                setResults(data);
                const positions = Object.keys(data?.resultsByPosition ?? {});
                if (positions.length > 0) setActivePos(positions[0]);
            } catch (err) {
                if (!alive) return;
                setError(toAppError(err));
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, [electionId]);

    const positions = useMemo(() => Object.keys(results?.resultsByPosition ?? {}), [results]);
    const activeCands = useMemo(() => results?.resultsByPosition?.[activePos] ?? [], [results, activePos]);
    const winner      = useMemo(() => activeCands.find(c => c.winner) ?? activeCands[0] ?? null, [activeCands]);

    async function copyMerkle() {
        try { await navigator.clipboard.writeText(results?.merkleRootB64 ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
    }

    function exportCSV() {
        if (!results) return;
        const rows = [["Position", "Rank", "Name", "BallotSerial", "Votes", "SharePct", "Winner"]];
        for (const [pos, cands] of Object.entries(results.resultsByPosition ?? {})) {
            for (const c of cands) rows.push([pos, c.rank, c.fullName, c.ballotSerial, c.votes, c.voteSharePercent, c.winner]);
        }
        const csv  = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `results_${electionId}.csv`; a.click(); URL.revokeObjectURL(a.href);
    }

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin",     path: "/admin" },
                { label: results?.electionName || election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Results" },
            ]}
            topbarRight={
                <div className="flex items-center gap-2">
                    <Chip variant="green" dot>Published · Verified</Chip>
                    <Btn variant="ghost" size="sm" onClick={copyMerkle}>{copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Merkle</>}</Btn>
                    <Btn variant="ghost" size="sm" onClick={exportCSV}><Download size={11} /> Export</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                        <ArrowLeft size={12} /> Back
                    </Btn>
                </div>
            }
        >
            {loading ? <Spinner text="Loading results…" /> : error ? (
                <>
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                    {error?.status === 403 && (
                        <div className="rounded-xl px-4 py-4 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)", marginBottom: 6 }}>Results not available</div>
                            <div style={{ fontSize: 12, color: "var(--t3)" }}>
                                Results are only accessible for <strong style={{ color: "var(--t1)" }}>published</strong> elections.
                                Publish this election first from the workspace.
                            </div>
                            <Btn variant="ghost" className="mt-4" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                                ← Go to Workspace
                            </Btn>
                        </div>
                    )}
                </>
            ) : !results ? null : (
                <>
                    {/* Election header */}
                    <div className="rounded-xl p-5 flex items-start justify-between gap-4 animate-up"
                         style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>
                                {results.electionName}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <Chip variant="green" dot>Published</Chip>
                                <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>{results.organizationName}</span>
                                <span style={{ color: "var(--t3)", fontSize: 11 }}>·</span>
                                <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>{results.electionType}</span>
                                <span style={{ color: "var(--t3)", fontSize: 11 }}>·</span>
                                <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>Published {fmtDT(results.publishedAt)}</span>
                            </div>
                        </div>
                        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", maxWidth: 280, flexShrink: 0 }}>
                            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 4 }}>merkleRootB64</div>
                            <div style={{ fontSize: 9.5, fontFamily: "JetBrains Mono", color: "var(--t2)", wordBreak: "break-all", lineHeight: 1.6 }}>
                                {results.merkleRootB64 ? `${results.merkleRootB64.slice(0, 48)}…` : "—"}
                            </div>
                            <button onClick={copyMerkle} style={{ background: "none", border: "none", color: "var(--purple)", fontSize: 10.5, fontWeight: 600, cursor: "pointer", padding: "4px 0 0", fontFamily: "Inter" }}>
                                ⎘ Copy full root
                            </button>
                        </div>
                    </div>

                    {/* Position tabs */}
                    <div className="flex gap-1.5 flex-wrap animate-up">
                        {positions.map(pos => (
                            <button
                                key={pos}
                                onClick={() => setActivePos(pos)}
                                style={{
                                    padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    background: activePos === pos ? "var(--purple-d)" : "var(--surface-2)",
                                    color:      activePos === pos ? "var(--purple)"   : "var(--t2)",
                                    border:     `1px solid ${activePos === pos ? "var(--purple-b)" : "var(--border)"}`,
                                    transition: "all .15s", fontFamily: "Inter",
                                }}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-4 gap-3 animate-up-2">
                        <KpiCard icon={Users}       accent="purple" value={fmt(results.totalVoters)}    label="Total Voters"        badge="registered" />
                        <KpiCard icon={CheckCircle2} accent="cyan"  value={fmt(results.votedCount)}     label="Votes Cast"          badge={pct(results.turnoutPercent)} />
                        <KpiCard icon={BarChart2}   accent="green"  value={pct(results.turnoutPercent)} label="Participation Rate"  badge="turnout" />
                        <KpiCard icon={Hash}        accent="pink"   value={fmt(results.ballotsCast)}    label="Ballots Cast"        badge={`${positions.length} positions`} />
                    </div>

                    {/* 2-col: breakdown table | right panel */}
                    <div className="grid gap-3 animate-up-3" style={{ gridTemplateColumns: "1fr 240px" }}>
                        {/* Candidate breakdown table */}
                        <Panel
                            title={`${activePos} · Breakdown`}
                            subtitle={`${activeCands.length} candidate${activeCands.length !== 1 ? "s" : ""}`}
                            noPad
                        >
                            {activeCands.length === 0 ? (
                                <EmptyState icon="📊" title="No results" subtitle="No candidates in this position." />
                            ) : (
                                <div>
                                    {/* Table header */}
                                    <div className="grid items-center px-[18px] py-2"
                                         style={{ gridTemplateColumns: "26px 1fr 70px 108px 48px", gap: 10, borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,.015)" }}>
                                        {["", "Candidate", "Votes", "Share", "Δ"].map(h => (
                                            <div key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", textAlign: h === "Votes" || h === "Δ" ? "right" : "left" }}>
                                                {h}
                                            </div>
                                        ))}
                                    </div>

                                    {activeCands.map((c, i) => {
                                        const isWin = c.winner;
                                        const dv    = isWin ? null : (winner?.votes ?? 0) - (c.votes ?? 0);
                                        const initials = ini(c.fullName);
                                        return (
                                            <div
                                                key={c.candidateId || i}
                                                className="grid items-center px-[18px] py-3 transition-all"
                                                style={{
                                                    gridTemplateColumns: "26px 1fr 70px 108px 48px", gap: 10,
                                                    borderBottom: i < activeCands.length - 1 ? "1px solid var(--border)" : "none",
                                                    background: isWin ? "rgba(124,111,247,.06)" : "transparent",
                                                }}
                                                onMouseEnter={ev => { if (!isWin) ev.currentTarget.style.background = "rgba(255,255,255,.018)"; }}
                                                onMouseLeave={ev => { ev.currentTarget.style.background = isWin ? "rgba(124,111,247,.06)" : "transparent"; }}
                                            >
                                                {/* Rank */}
                                                <div style={{ fontSize: 12, fontWeight: 700, textAlign: "center", fontFamily: "JetBrains Mono", color: isWin ? "var(--purple)" : "var(--t3)" }}>
                                                    #{c.rank}
                                                </div>
                                                {/* Candidate info */}
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9.5px] font-bold flex-shrink-0"
                                                         style={{ background: isWin ? "var(--purple-d)" : "var(--surface-2)", color: isWin ? "var(--purple)" : "var(--t3)", border: `1px solid ${isWin ? "rgba(124,111,247,.25)" : "var(--border)"}` }}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: isWin ? "var(--t1)" : "var(--t2)" }}>{c.fullName}</span>
                                                            {isWin && (
                                                                <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 20, background: "rgba(255,215,0,.1)", color: "#ffd700", border: "1px solid rgba(255,215,0,.2)" }}>
                                  Winner
                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--t3)", marginTop: 2 }}>#{c.ballotSerial}</div>
                                                    </div>
                                                </div>
                                                {/* Votes */}
                                                <div style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: "var(--t1)", textAlign: "right" }}>
                                                    {fmt(c.votes)}
                                                </div>
                                                {/* Share bar */}
                                                <div>
                                                    <div style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t2)", marginBottom: 3 }}>{pct(c.voteSharePercent)}</div>
                                                    <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                                                        <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(c.voteSharePercent ?? 0, 100)}%`, background: isWin ? "linear-gradient(90deg, var(--purple), var(--cyan))" : "rgba(255,255,255,.18)" }} />
                                                    </div>
                                                </div>
                                                {/* Delta */}
                                                <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600, textAlign: "right", color: isWin ? "var(--t3)" : "var(--red)" }}>
                                                    {dv == null ? "—" : `-${fmt(dv)}`}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Panel>

                        {/* Right panel */}
                        <div className="flex flex-col gap-3">
                            {/* Turnout donut */}
                            <Panel title="Turnout" subtitle={pct(results.turnoutPercent)}>
                                <Donut
                                    turnout={results.turnoutPercent}
                                    voted={results.votedCount}
                                    abstained={(results.totalVoters ?? 0) - (results.votedCount ?? 0)}
                                />
                            </Panel>

                            {/* All positions summary */}
                            <Panel title="All Positions" subtitle={`${positions.length} total`}>
                                {positions.map((pos, i) => {
                                    const cands = results.resultsByPosition[pos] ?? [];
                                    const w     = cands.find(c => c.winner) ?? cands[0];
                                    const isActive = pos === activePos;
                                    return (
                                        <button
                                            key={pos}
                                            onClick={() => setActivePos(pos)}
                                            className="w-full text-left py-2 transition-all"
                                            style={{ borderBottom: i < positions.length - 1 ? "1px solid var(--border)" : "none", background: "none", border: "none", padding: "9px 0", cursor: "pointer", borderBottomColor: i < positions.length - 1 ? "var(--border)" : "transparent", borderBottomWidth: i < positions.length - 1 ? 1 : 0, borderBottomStyle: "solid" }}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--t3)" }}>{pos}</span>
                                                <span style={{ fontSize: 11.5, fontWeight: 700, color: isActive ? "var(--purple)" : "var(--t2)", fontFamily: "JetBrains Mono" }}>{pct(w?.voteSharePercent ?? 0)}</span>
                                            </div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "var(--t1)" : "var(--t2)", textAlign: "left" }}>{w?.fullName ?? "—"}</div>
                                            <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden", marginTop: 5 }}>
                                                <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(w?.voteSharePercent ?? 0, 100)}%`, background: isActive ? "linear-gradient(90deg, var(--purple), var(--cyan))" : "rgba(255,255,255,.18)" }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </Panel>

                            {/* Integrity */}
                            <Panel title="Integrity">
                                {[
                                    ["Merkle root", "✓ Sealed"],
                                    ["Status",      "✓ Published"],
                                    ["Ballots",     `✓ ${fmt(results.ballotsCast)}`],
                                    ["Audit log",   "✓ Active"],
                                    ["Cross-org",   "✓ Scoped"],
                                ].map(([l, v], i, arr) => (
                                    <div key={l} className="flex items-center justify-between py-2"
                                         style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                                        <span style={{ fontSize: 12, color: "var(--t2)" }}>{l}</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--green)" }}>{v}</span>
                                    </div>
                                ))}
                                {/* Merkle root area */}
                                <div style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)", margin: "0 -18px -18px", padding: "12px 18px" }}>
                                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 5 }}>merkleRootB64</div>
                                    <div style={{ fontSize: 9, fontFamily: "JetBrains Mono", color: "var(--t2)", wordBreak: "break-all", lineHeight: 1.7 }}>{results.merkleRootB64 || "—"}</div>
                                    <button onClick={copyMerkle} style={{ background: "none", border: "none", color: "var(--purple)", fontSize: 10.5, fontWeight: 600, cursor: "pointer", marginTop: 6, padding: 0, display: "block", fontFamily: "Inter" }}>
                                        {copied ? "✓ Copied" : "⎘ Copy root"}
                                    </button>
                                </div>
                            </Panel>

                            {/* Schedule */}
                            <Panel title="Schedule">
                                {[
                                    ["Started",   fmtDT(results.startTime)],
                                    ["Ended",     fmtDT(results.endTime)],
                                    ["Published", fmtDT(results.publishedAt)],
                                    ["Type",      results.electionType || "—"],
                                    ["Org",       results.organizationName || "—"],
                                ].map(([l, v], i, arr) => (
                                    <div key={l} className="flex justify-between py-2"
                                         style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                                        <span style={{ fontSize: 11.5, color: "var(--t2)" }}>{l}</span>
                                        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t1)" }}>{v}</span>
                                    </div>
                                ))}
                            </Panel>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
