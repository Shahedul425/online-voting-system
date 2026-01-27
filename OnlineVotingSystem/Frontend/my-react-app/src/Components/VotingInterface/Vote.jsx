"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";

/**
 * Voting (Pick candidates) page
 * - Loads candidates for selected election
 * - Groups by position
 * - User picks 1 per position
 * - On "Review selections" -> navigate to /final-vote
 * - Final submit happens in FinalVote component
 */

function groupByPosition(candidates = []) {
    const map = new Map();
    for (const c of candidates) {
        const pos = (c.position || "Other").trim();
        if (!map.has(pos)) map.set(pos, []);
        map.get(pos).push(c);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([position, list]) => ({
            position,
            candidates: list.sort((x, y) => (x.ballotSerial ?? 0) - (y.ballotSerial ?? 0)),
        }));
}

export default function Vote() {
    const navigate = useNavigate();
    const { election } = useAppStore();

    const electionId = election?.id || election;
    const [positions, setPositions] = useState([]); // [{ position, candidates }]
    const [selected, setSelected] = useState({}); // { [positionName]: candidateId }

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const tokenId = useMemo(() => {
        try {
            return sessionStorage.getItem("vote_token");
        } catch {
            return null;
        }
    }, []);

    const missing = useMemo(
        () => positions.filter((p) => !selected[p.position]).map((p) => p.position),
        [positions, selected]
    );

    useEffect(() => {
        let alive = true;

        async function load() {
            setError(null);

            if (!electionId) {
                setLoading(false);
                setError({ message: "No election selected. Please go back and select an election." });
                return;
            }

            setLoading(true);
            const res = await OVS.getVoterCandidates({ electionId });

            if (!alive) return;

            setLoading(false);

            if (!res.ok) {
                setError(res.error);
                return;
            }

            const grouped = groupByPosition(res.data || []);
            setPositions(grouped);
            setSelected({});
        }

        load();
        return () => {
            alive = false;
        };
    }, [electionId]);

    function pick(position, candidateId) {
        setSelected((prev) => ({ ...prev, [position]: candidateId }));
    }

    function goToReview() {
        setError(null);

        if (!electionId) {
            setError({ message: "No election selected." });
            return;
        }
        if (!tokenId) {
            setError({ message: "Missing vote token. Please verify first to get a token." });
            return;
        }
        if (positions.length === 0) {
            setError({ message: "No candidates found for this election." });
            return;
        }
        if (missing.length > 0) {
            setError({
                message: "Please select a candidate for every position.",
                details: missing.map((p) => ({ field: p, issue: "Selection required" })),
            });
            return;
        }

        // Save picks + minimal candidate info for FinalVote page (survive refresh in-tab)
        try {
            const payload = {
                electionId,
                selected, // { positionName: candidateId }
                // store a lightweight view of candidates (final screen needs name/party/photo)
                candidates: (positions || []).flatMap((p) =>
                    (p.candidates || []).map((c) => ({
                        id: c.id,
                        firstName: c.firstName,
                        lastName: c.lastName,
                        name: c.name,
                        party: c.party,
                        position: c.position,
                        photoUrl: c.photoUrl,
                        image: c.image,
                        ballotSerial: c.ballotSerial,
                    }))
                ),
                createdAt: Date.now(),
            };
            sessionStorage.setItem("ballot_review", JSON.stringify(payload));
        } catch {}

        navigate("/final-vote");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-6xl">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-300" />
                        <span className="text-sm text-white/80">OVS • Voting</span>
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Select Your Candidates</h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/60">
                        Choose one candidate per position. You will review your selections before submitting.
                    </p>
                </div>

                {/* Election / Token bar */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs text-white/50">Election</div>
                            <div className="mt-1 text-sm font-semibold text-white/90">
                                {election?.name ? election.name : electionId ? `Election ID: ${electionId}` : "Not selected"}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2">
                            <span className={`h-2 w-2 rounded-full ${tokenId ? "bg-emerald-400" : "bg-amber-300"}`} />
                            <div className="text-xs text-white/70">
                                {tokenId ? "Token loaded (ready)" : "No token (verify first)"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
                            <div className="w-full">
                                <div className="font-semibold text-red-200">Error</div>
                                <div className="mt-1 text-sm text-white/80">{error.message || "Request failed"}</div>

                                {Array.isArray(error.details) && error.details.length > 0 && (
                                    <ul className="mt-3 space-y-1 text-xs text-white/70">
                                        {error.details.map((d, i) => (
                                            <li key={i}>
                                                <span className="font-mono">{d.field}</span>: {d.issue}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Candidates */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-white/70">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading candidates...
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="py-12 text-center text-white/60">No candidates available.</div>
                    ) : (
                        <div className="space-y-8">
                            {positions.map((pos) => (
                                <section
                                    key={pos.position}
                                    className="rounded-2xl border border-white/10 bg-zinc-950/30 p-5"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">{pos.position}</h3>

                                        {selected[pos.position] ? (
                                            <div className="flex items-center gap-1 text-emerald-300 text-sm font-medium">
                                                <CheckCircle2 size={18} /> Selected
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-300">Selection required</div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {pos.candidates.map((c) => {
                                            const isPicked = selected[pos.position] === c.id;
                                            const fullName =
                                                `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.name || "Candidate";
                                            const party = c.party || "Independent";
                                            const img = c.photoUrl || c.image || null;

                                            return (
                                                <button
                                                    type="button"
                                                    key={c.id}
                                                    onClick={() => pick(pos.position, c.id)}
                                                    className={`group relative overflow-hidden rounded-2xl border text-left transition ${
                                                        isPicked
                                                            ? "border-emerald-400/60 bg-emerald-500/10 ring-1 ring-emerald-400/40"
                                                            : "border-white/10 bg-zinc-900/40 hover:border-indigo-400/40 hover:bg-zinc-900/60"
                                                    }`}
                                                >
                                                    <div className="h-36 w-full bg-zinc-900/60">
                                                        {img ? (
                                                            <img
                                                                src={img}
                                                                alt={fullName}
                                                                className="h-36 w-full object-cover opacity-90"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex h-36 items-center justify-center text-xs text-white/40">
                                                                No photo
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="text-base font-semibold text-white/90">{fullName}</div>
                                                                <div className="mt-1 text-sm text-white/60">{party}</div>
                                                            </div>

                                                            {isPicked ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-200">
                                  <CheckCircle2 size={14} /> Picked
                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                                  Select
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}

                            {/* Footer actions */}
                            <div className="pt-2">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="text-xs text-white/50">
                                        {missing.length > 0 ? `Missing: ${missing.join(", ")}` : "All positions selected."}
                                    </div>

                                    <button
                                        onClick={goToReview}
                                        disabled={missing.length > 0 || !tokenId}
                                        className="w-full max-w-md rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:opacity-60"
                                    >
                                        Review Selections
                                    </button>

                                    <div className="text-center text-xs text-white/40">
                                        You will confirm on the next page before submitting.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
