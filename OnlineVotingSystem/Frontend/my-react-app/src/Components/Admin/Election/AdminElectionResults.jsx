// ✅ src/Components/Admin/Election/AdminElectionResults.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Loader2, BarChart3, Copy, Check } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";

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

function pill(base) {
    return `inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border ${base}`;
}

function statusPill(s) {
    const v = String(s || "").toLowerCase();
    if (v === "published") return pill("border-purple-500/20 bg-purple-500/10 text-purple-200");
    if (v === "closed") return pill("border-sky-500/20 bg-sky-500/10 text-sky-200");
    return pill("border-white/10 bg-white/5 text-white/70");
}

function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
}

function pct(n) {
    return `${Number(n ?? 0).toFixed(2)}%`;
}

function shortenMiddle(str, left = 12, right = 12) {
    const s = String(str || "");
    if (!s) return "—";
    if (s.length <= left + right + 3) return s;
    return `${s.slice(0, left)}…${s.slice(-right)}`;
}

/**
 * Trend series extraction:
 * Supports a few common shapes, without breaking if not present.
 * - r.trend: number[]
 * - r.trendPoints: number[]
 * - r.votesOverTime: number[]
 * - r.timeSeries: { value:number }[]
 * - r.timeline: { votes:number }[] | { count:number }[]
 */
function getTrendSeries(r) {
    const tryNums = (arr) =>
        Array.isArray(arr) ? arr.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];

    let series = tryNums(r?.trend);
    if (series.length) return series;

    series = tryNums(r?.trendPoints);
    if (series.length) return series;

    series = tryNums(r?.votesOverTime);
    if (series.length) return series;

    if (Array.isArray(r?.timeSeries)) {
        series = r.timeSeries
            .map((x) => Number(x?.value ?? x?.votes ?? x?.count))
            .filter((x) => Number.isFinite(x));
        if (series.length) return series;
    }

    if (Array.isArray(r?.timeline)) {
        series = r.timeline
            .map((x) => Number(x?.votes ?? x?.count ?? x?.value))
            .filter((x) => Number.isFinite(x));
        if (series.length) return series;
    }

    return [];
}

export default function AdminElectionResults() {
    const navigate = useNavigate();
    const { electionId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [data, setData] = useState(null);
    const [position, setPosition] = useState("");

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let alive = true;

        async function load() {
            setError(null);
            setLoading(true);

            const res = await OVS.getAdminElectionResults({ electionId });
            if (!alive) return;

            setLoading(false);
            if (!res.ok) {
                setError(toAppError(res));
                return;
            }

            setData(res.data);

            const positions = Object.keys(res.data?.resultsByPosition || {});
            setPosition((p) => p || positions[0] || "");
        }

        if (electionId) load();
        return () => {
            alive = false;
        };
    }, [electionId]);

    const positions = useMemo(() => Object.keys(data?.resultsByPosition || {}), [data]);

    const rowsRaw = useMemo(() => (position ? data?.resultsByPosition?.[position] || [] : []), [data, position]);

    // Ensure winner first (rank asc), stable sort
    const rows = useMemo(() => {
        const copy = [...(rowsRaw || [])];
        copy.sort((a, b) => Number(a?.rank ?? 999999) - Number(b?.rank ?? 999999));
        return copy;
    }, [rowsRaw]);

    const topWinner = rows?.[0] || null;
    const runnerUp = rows?.[1] || null;

    const margin = useMemo(() => {
        if (!topWinner || !runnerUp) return null;
        const winVotes = Number(topWinner.votes ?? 0);
        const runVotes = Number(runnerUp.votes ?? 0);
        const winShare = Number(topWinner.voteSharePercent ?? 0);
        const runShare = Number(runnerUp.voteSharePercent ?? 0);

        return {
            runnerUpName: runnerUp.fullName,
            marginVotes: winVotes - runVotes,
            marginPts: winShare - runShare,
        };
    }, [topWinner, runnerUp]);

    const voted = Number(data?.votedCount ?? 0);
    const totalVoters = Number(data?.totalVoters ?? 0);
    const notVoted = Math.max(0, totalVoters - voted);

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(String(text ?? ""));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 900);
        } catch {}
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            {/* hide scrollbars (still scrollable) */}
            <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

            <div className="mx-auto w-full max-w-6xl">
                <button
                    onClick={() => navigate(`/admin/elections/${electionId}`)}
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Workspace
                </button>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <BarChart3 className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Admin • Results</span>
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight truncate">
                            {data?.electionName || "Election Results"}
                        </h1>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/60">
                            <span className={statusPill(data?.status)}>{String(data?.status || "—").toUpperCase()}</span>
                            <span className="text-xs text-white/40 font-mono">{data?.electionId || electionId}</span>
                        </div>
                    </div>

                    <div className="w-full sm:w-[440px] space-y-3">
                        <div>
                            <label className="text-xs text-white/60">Position</label>
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                            >
                                {positions.length === 0 ? <option value="">No positions</option> : null}
                                {positions.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Merkle Root - nicely visible with copy icon */}
                        {data?.merkleRootB64 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs text-white/50">Merkle Root</div>
                                        <div className="mt-1 font-mono text-xs text-white/75 break-all">
                                            {shortenMiddle(data.merkleRootB64, 18, 18)}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => copyToClipboard(data.merkleRootB64)}
                                        className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-xs hover:bg-white/10"
                                        title="Copy Merkle Root"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-white/70">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading results...
                        </div>
                    ) : !data ? (
                        <div className="py-12 text-center text-white/60">No data.</div>
                    ) : (
                        <>
                            {/* KPI cards */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Kpi title="Total voters" value={String(data.totalVoters ?? 0)} />
                                <Kpi title="Voted" value={String(data.votedCount ?? 0)} />
                                <Kpi title="Turnout" value={pct(data.turnoutPercent ?? 0)} />
                                <Kpi title="Ballots cast" value={String(data.ballotsCast ?? 0)} />
                            </div>

                            {/* Info row: clearer spacing */}
                            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                                <Info
                                    title="Organization"
                                    value={data.organizationName || String(data.organizationId || "—")}
                                    mono={!data.organizationName}
                                />
                                <Info title="Published at" value={fmtDate(data.publishedAt)} />
                                <Info title="Schedule" value={`${fmtDate(data.startTime)} → ${fmtDate(data.endTime)}`} />
                            </div>

                            {/* Charts row: Turnout + Winner beside it */}
                            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                                {/* Turnout */}
                                <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 lg:col-span-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-white/50">Turnout</div>
                                            <div className="mt-1 text-sm text-white/80">{voted.toLocaleString()} voted</div>
                                        </div>
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {pct(data.turnoutPercent ?? 0)}
                    </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-center">
                                        <DonutChart
                                            size={150}
                                            thickness={14}
                                            segments={[
                                                { value: voted, className: "stroke-indigo-400/70" },
                                                { value: notVoted, className: "stroke-white/10" },
                                            ]}
                                            centerTop={pct(data.turnoutPercent ?? 0)}
                                            centerBottom="turnout"
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                        <LegendDot label="Voted" value={voted.toLocaleString()} dotClassName="bg-indigo-400/70" />
                                        <LegendDot label="Not voted" value={notVoted.toLocaleString()} dotClassName="bg-white/20" />
                                    </div>
                                </div>

                                {/* Winner beside chart */}
                                <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 lg:col-span-2">
                                    <div className="flex flex-wrap items-end justify-between gap-2">
                                        <div>
                                            <div className="text-xs text-white/50">Winner</div>
                                            <div className="mt-1 text-sm font-semibold text-white/85">Position • {position || "—"}</div>
                                        </div>

                                        {margin ? (
                                            <span
                                                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                                                title={`Winner margin vs ${margin.runnerUpName || "runner-up"}`}
                                            >
                        <span className="text-emerald-200/90">Margin</span>
                        <span className="text-white/50">•</span>
                        <span className="font-mono">+{Number(margin.marginVotes).toLocaleString()} votes</span>
                        <span className="text-white/50">•</span>
                        <span className="font-mono">+{Number(margin.marginPts).toFixed(2)} pts</span>
                      </span>
                                        ) : (
                                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                        {rows.length ? `${rows.length} candidates` : "No candidates"}
                      </span>
                                        )}
                                    </div>

                                    {!topWinner ? (
                                        <div className="mt-6 text-center text-white/60">No results for this position.</div>
                                    ) : (
                                        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                                                    <Trophy className="h-5 w-5 text-amber-200" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-amber-100">Winner • {position}</div>
                                                    <div className="mt-1 text-xl font-extrabold tracking-tight text-white">
                                                        {topWinner.fullName}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/70">
                            <span>
                              {Number(topWinner.votes ?? 0).toLocaleString()} votes • {pct(topWinner.voteSharePercent ?? 0)}
                            </span>
                                                        {topWinner.ballotSerial ? (
                                                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-mono text-white/55">
                                {topWinner.ballotSerial}
                              </span>
                                                        ) : null}
                                                        {(() => {
                                                            const t = getTrendSeries(topWinner);
                                                            return t.length >= 2 ? (
                                                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                                  Trend <Sparkline values={t} winner title="Winner trend" />
                                </span>
                                                            ) : null;
                                                        })()}
                                                    </div>

                                                    {runnerUp ? (
                                                        <div className="mt-3 text-xs text-white/50">
                                                            Runner-up: <span className="text-white/70 font-semibold">{runnerUp.fullName}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 text-xs text-white/40">
                                        Winner block summarizes the top candidate; detailed breakdown is below.
                                    </div>
                                </div>
                            </div>

                            {/* ONE list only: bottom table (enhanced with side-info + trend + margin) */}
                            <div className="mt-6">
                                <div className="flex items-end justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-white/85">Candidate results</div>
                                        <div className="mt-1 text-xs text-white/50">
                                            Includes margin vs leader and sparkline if your API provides time-series for a candidate.
                                        </div>
                                    </div>
                                    <div className="text-xs text-white/50">
                                        {rows.length ? `${rows.length} candidates` : "—"}
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/20">
                                    <div className="max-h-[520px] overflow-auto no-scrollbar">
                                        <table className="w-full text-left text-sm">
                                            <thead className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur text-xs text-white/50">
                                            <tr className="border-b border-white/10">
                                                <th className="py-3 px-4">Rank</th>
                                                <th className="py-3 pr-4">Candidate</th>
                                                <th className="py-3 pr-4">Serial</th>
                                                <th className="py-3 pr-4">Votes</th>
                                                <th className="py-3 pr-4">Share</th>
                                                <th className="py-3 pr-4">ΔVotes</th>
                                                <th className="py-3 pr-4">ΔPts</th>
                                                <th className="py-3 pr-4">Trend</th>
                                            </tr>
                                            </thead>

                                            <tbody className="divide-y divide-white/10">
                                            {rows.map((r) => {
                                                const leaderVotes = Number(topWinner?.votes ?? 0);
                                                const leaderShare = Number(topWinner?.voteSharePercent ?? 0);

                                                const votes = Number(r.votes ?? 0);
                                                const share = Number(r.voteSharePercent ?? 0);

                                                const dVotes = leaderVotes - votes; // 0 for winner
                                                const dPts = leaderShare - share;

                                                const trend = getTrendSeries(r);
                                                const hasTrend = trend.length >= 2;

                                                return (
                                                    <tr
                                                        key={r.candidateId}
                                                        className={r.winner ? "bg-emerald-500/5" : "hover:bg-white/5"}
                                                    >
                                                        <td className="py-3 px-4">
                                <span
                                    className={[
                                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border",
                                        r.winner
                                            ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
                                            : "bg-white/5 text-white/70 border-white/10",
                                    ].join(" ")}
                                >
                                  #{r.rank}
                                </span>
                                                        </td>

                                                        <td className="py-3 pr-4">
                                                            <div className="font-semibold text-white/90">{r.fullName}</div>
                                                            {r.winner && margin ? (
                                                                <div className="mt-1 text-[11px] text-emerald-200/80">
                                                                    Leads by +{Number(margin.marginVotes).toLocaleString()} votes • +{Number(margin.marginPts).toFixed(2)} pts
                                                                </div>
                                                            ) : null}
                                                        </td>

                                                        <td className="py-3 pr-4 font-mono text-xs text-white/70">
                                                            {r.ballotSerial || "—"}
                                                        </td>

                                                        <td className="py-3 pr-4 text-white/80">{votes.toLocaleString()}</td>

                                                        <td className="py-3 pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-32 rounded-full bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-indigo-400/60"
                                                                        style={{
                                                                            width: `${clamp(Number(r.voteSharePercent || 0), 0, 100)}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-white/70">{pct(share)}</div>
                                                            </div>
                                                        </td>

                                                        <td className="py-3 pr-4">
                                <span className="font-mono text-xs text-white/70">
                                  {r.winner ? "—" : `-${dVotes.toLocaleString()}`}
                                </span>
                                                        </td>

                                                        <td className="py-3 pr-4">
                                <span className="font-mono text-xs text-white/70">
                                  {r.winner ? "—" : `-${dPts.toFixed(2)}`}
                                </span>
                                                        </td>

                                                        <td className="py-3 pr-4">
                                                            {hasTrend ? (
                                                                <Sparkline values={trend} winner={!!r.winner} title="Candidate trend" />
                                                            ) : (
                                                                <span className="text-xs text-white/35">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {rows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="py-10 text-center text-white/60">
                                                        No results for this position.
                                                    </td>
                                                </tr>
                                            ) : null}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6 text-center text-xs text-white/35">
                                    Results are derived from VoteSelectionModel tallies and secured by the stored Merkle root.
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Kpi({ title, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-4">
            <div className="text-xs text-white/50">{title}</div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight text-white/90">{value}</div>
        </div>
    );
}

function Info({ title, value, mono }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-4">
            <div className="text-xs text-white/50">{title}</div>
            <div className={["mt-2 text-sm text-white/85 leading-6", mono ? "font-mono text-xs break-all" : ""].join(" ")}>
                {value}
            </div>
        </div>
    );
}

function LegendDot({ label, value, dotClassName }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
                <span className={["h-2.5 w-2.5 rounded-full", dotClassName].join(" ")} />
                <span className="text-white/70">{label}</span>
            </div>
            <span className="font-mono text-white/60">{value}</span>
        </div>
    );
}

/**
 * Simple SVG donut chart (no deps).
 * segments: [{ value, className }]
 */
function DonutChart({ size = 160, thickness = 14, segments, centerTop, centerBottom }) {
    const total = segments.reduce((a, s) => a + (Number(s.value) || 0), 0);
    const r = (size - thickness) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;

    let acc = 0;
    const strokes = segments.map((s, idx) => {
        const v = Number(s.value) || 0;
        const frac = total > 0 ? v / total : 0;
        const dash = frac * circumference;
        const gap = circumference - dash;
        const offset = -(acc * circumference);
        acc += frac;

        return (
            <circle
                key={idx}
                cx={c}
                cy={c}
                r={r}
                fill="transparent"
                strokeWidth={thickness}
                strokeLinecap="round"
                className={s.className}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dasharray 600ms ease, stroke-dashoffset 600ms ease" }}
            />
        );
    });

    return (
        <div className="relative">
            <svg width={size} height={size} className="block">
                <circle cx={c} cy={c} r={r} fill="transparent" strokeWidth={thickness} className="stroke-white/10" />
                <g transform={`rotate(-90 ${c} ${c})`}>{strokes}</g>
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-extrabold text-white/90">{centerTop}</div>
                <div className="text-[11px] uppercase tracking-wide text-white/45">{centerBottom}</div>
            </div>
        </div>
    );
}

/**
 * Sparkline: tiny inline SVG line chart
 * - uses winner color (emerald) or indigo to keep the theme.
 */
function Sparkline({ values, winner, title }) {
    const w = 86;
    const h = 20;
    const pad = 2;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const pts = values.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
        const y = h - pad - ((v - min) * (h - pad * 2)) / span;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            className="rounded-md border border-white/10 bg-zinc-900/30"
            role="img"
            aria-label={title || "sparkline"}
            title={title}
        >
            <line x1="0" y1={h - 1} x2={w} y2={h - 1} className="stroke-white/10" />
            <polyline
                fill="none"
                points={pts.join(" ")}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={winner ? "stroke-emerald-400/70" : "stroke-indigo-400/70"}
            />
        </svg>
    );
}
