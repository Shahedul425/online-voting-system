"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";

/**
 * FinalVote (Review + Submit) page
 * Reads ballot_review from sessionStorage (created by Vote component)
 * Submits ONE ballot via OVS.castVoteBallot (RequestBody)
 */

function safeJsonParse(s) {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}

export default function FinalVote() {
    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [receipt, setReceipt] = useState(null);

    const tokenId = useMemo(() => {
        try {
            return sessionStorage.getItem("vote_token");
        } catch {
            return null;
        }
    }, []);

    const review = useMemo(() => {
        try {
            const raw = sessionStorage.getItem("ballot_review");
            return safeJsonParse(raw);
        } catch {
            return null;
        }
    }, []);

    const selections = useMemo(() => {
        if (!review?.selected || !review?.candidates) return [];
        const selectedMap = review.selected; // { position: candidateId }
        const byId = new Map((review.candidates || []).map((c) => [c.id, c]));

        return Object.entries(selectedMap).map(([position, candidateId]) => {
            const c = byId.get(candidateId);
            const fullName = c ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.name : "Candidate";
            return {
                position,
                candidateId,
                name: fullName,
                party: c?.party || "Independent",
                image: c?.photoUrl || c?.image || null,
            };
        });
    }, [review]);

    function goBack() {
        navigate("/vote");
    }

    async function submit() {
        setError(null);
        setReceipt(null);

        if (!review?.electionId) {
            setError({ message: "Missing election. Please go back and try again." });
            return;
        }
        if (!tokenId) {
            setError({ message: "Missing token. Please verify again." });
            return;
        }
        if (!Array.isArray(selections) || selections.length === 0) {
            setError({ message: "No selections to submit." });
            return;
        }

        const requestId =
            (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
            `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const payloadVotes = selections.map((s) => ({
            position: s.position,
            candidateId: s.candidateId,
        }));

        setSubmitting(true);
        const res = await OVS.castVoteBallot({
            electionId: review.electionId,
            tokenId,
            requestId,
            votes: payloadVotes,
        });
        setSubmitting(false);

        if (!res.ok) {
            setError(res.error);
            return;
        }

        setReceipt(res.data);

        // Clear token + review after success
        try {
            sessionStorage.setItem("vote_receipt", JSON.stringify(res.data));
            sessionStorage.removeItem("vote_token");
            sessionStorage.removeItem("vote_token_expiry");
            sessionStorage.removeItem("ballot_review");
            navigate("/thank-you")
        } catch {}
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-5xl">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-300" />
                        <span className="text-sm text-white/80">OVS • Final Review</span>
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Review Your Selections</h1>
                    <p className="mt-2 text-sm text-white/60">
                        Please verify your selected candidates before final submission.
                    </p>
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

                {/* Receipt */}
                {receipt && (
                    <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                        <div className="flex items-center gap-2 text-emerald-200 font-semibold">
                            <CheckCircle2 className="h-5 w-5" />
                            Vote submitted successfully
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
                            <div className="text-xs text-white/60">Receipt Token</div>
                            <div className="mt-2 break-all font-mono text-sm">
                                {receipt.receiptToken || receipt.receiptHashToken || receipt.receipt}
                            </div>
                            {receipt.createdAt && (
                                <>
                                    <div className="mt-4 text-xs text-white/60">Timestamp</div>
                                    <div className="mt-1 text-sm">{new Date(receipt.createdAt).toLocaleString()}</div>
                                </>
                            )}
                            <div className="mt-3 text-xs text-white/50">
                                Save this receipt to verify inclusion after results are published.
                            </div>
                        </div>
                    </div>
                )}

                {/* Review list */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {!review ? (
                        <div className="py-10 text-center text-white/60">
                            No review data found. Please go back to the voting page.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {selections.map((s) => (
                                <div
                                    key={s.position}
                                    className="rounded-2xl border border-white/10 bg-zinc-950/30 p-5"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">{s.position}</h3>
                                        <div className="flex items-center gap-1 text-emerald-300 text-sm font-medium">
                                            <CheckCircle2 size={18} /> Confirmed
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
                                        <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                                            {s.image ? (
                                                <img
                                                    src={s.image}
                                                    alt={s.name}
                                                    className="h-24 w-24 object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-24 w-24 items-center justify-center text-xs text-white/40">
                                                    No photo
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center sm:text-left">
                                            <div className="text-lg font-semibold text-white/90">{s.name}</div>
                                            <div className="mt-1 text-sm text-white/60">{s.party}</div>
                                            <div className="mt-1 text-xs text-white/40">Selected for {s.position}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Actions */}
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    disabled={submitting || !!receipt}
                                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 transition disabled:opacity-60"
                                >
                                    ← Go Back & Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={submitting || !!receipt}
                                    className="rounded-xl bg-indigo-500 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-400 transition disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                                    ) : receipt ? (
                                        "Vote submitted"
                                    ) : (
                                        "Confirm & Submit Vote"
                                    )}
                                </button>
                            </div>

                            <div className="text-center text-xs text-white/40">
                                Uses ApiError responses — UI never crashes.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
