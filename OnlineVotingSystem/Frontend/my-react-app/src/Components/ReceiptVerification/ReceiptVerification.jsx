// ✅ src/Components/Voter/ReceiptVerification/VerifyReceipt.jsx
"use client";

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Copy, ArrowLeft } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints.js";
import { toAppError } from "../../Service/ErrorHandling/appError.js";
import { ErrorBanner } from "../Errors/ErrorBanner.jsx";

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

function shortHash(s, n = 10) {
    if (!s) return "—";
    const x = String(s);
    if (x.length <= n * 2) return x;
    return `${x.slice(0, n)}…${x.slice(-n)}`;
}

function pillClass(ok) {
    const base = "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border";
    return ok
        ? `${base} bg-emerald-500/10 text-emerald-200 border-emerald-500/20`
        : `${base} bg-red-500/10 text-red-200 border-red-500/20`;
}

export default function VerifyReceipt() {
    const navigate = useNavigate();

    const [receiptToken, setReceiptToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [result, setResult] = useState(null); // VerifyReceiptResponse

    const canVerify = useMemo(() => receiptToken.trim().length > 10, [receiptToken]);

    async function verify() {
        setError(null);
        setResult(null);

        const token = receiptToken.trim();
        if (!token) return;

        setLoading(true);
        const res = await OVS.verifyReceipt({ receiptToken: token });
        setLoading(false);

        if (!res.ok) {
            setError(toAppError(res));
            return;
        }
        setResult(res.data);
    }

    async function copy(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // ignore
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-6xl">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <ShieldCheck className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Voter • Receipt Verification</span>
                        </div>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Verify your vote</h1>
                        <p className="mt-2 text-sm text-white/60 max-w-2xl">
                            Paste your receipt token to confirm your vote was included in the published Merkle root for that election.
                        </p>
                    </div>

                    <button
                        onClick={verify}
                        disabled={!canVerify || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 transition disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Verify
                    </button>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                {/* Input */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    <label className="text-xs text-white/60">Receipt token</label>
                    <div className="mt-2 flex items-start gap-2">
            <textarea
                value={receiptToken}
                onChange={(e) => setReceiptToken(e.target.value)}
                placeholder="Paste receipt token here (payload.signature)"
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-900/40 px-3 py-3 text-sm outline-none focus:border-indigo-400/60 placeholder:text-white/30"
            />
                        <button
                            type="button"
                            onClick={() => copy(receiptToken.trim())}
                            className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                            title="Copy token"
                        >
                            <Copy className="h-4 w-4 text-white/70" />
                        </button>
                    </div>

                    <div className="mt-3 text-xs text-white/45">
                        Tip: you can store this token locally. You don’t need to provide electionId — it’s embedded and signed.
                    </div>
                </div>

                {/* Result */}
                {result ? (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left: status */}
                        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-white/80">Verification result</div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={pillClass(!!result.included)}>
                      {result.included ? "Included in Merkle root" : "Not included"}
                    </span>
                                        {result.included ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-300" />
                                        )}
                                    </div>

                                    <div className="mt-4 text-sm text-white/60">
                                        {result.included
                                            ? "✅ Your receipt is proven to be part of the published election commitment."
                                            : "❌ This receipt could not be proven against the published commitment."}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setError(null);
                                    }}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoCard label="Election" value={result.electionName || "—"} />
                                <InfoCard label="Voted at" value={fmtDate(result.votedAt)} />
                                <InfoCard label="Election ID" value={result.electionId || "—"} mono />
                                <InfoCard label="Organization ID" value={result.organizationId || "—"} mono />
                            </div>

                            <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-white/80">Merkle commitment</div>
                                    <button
                                        onClick={() => copy(result.merkleRootB64 || "")}
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy root
                                    </button>
                                </div>

                                <div className="mt-3 text-xs text-white/60">
                                    Root (base64url):{" "}
                                    <span className="font-mono text-white/80 break-all">{result.merkleRootB64 || "—"}</span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    Leaf index: <span className="text-white/80 font-semibold">{result.leafIndex ?? "—"}</span>
                  </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    Tree depth: <span className="text-white/80 font-semibold">{result.treeDepth ?? "—"}</span>
                  </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    Proof steps:{" "}
                                        <span className="text-white/80 font-semibold">{result.proof?.length ?? 0}</span>
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: proof (optional but useful) */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur h-fit lg:sticky lg:top-6">
                            <div className="text-sm font-semibold text-white/80">Proof path</div>
                            <p className="mt-2 text-xs text-white/50">
                                These are sibling hashes used to recompute the root. You can verify locally if you want.
                            </p>

                            {!Array.isArray(result.proof) || result.proof.length === 0 ? (
                                <div className="mt-5 text-sm text-white/50">No proof returned.</div>
                            ) : (
                                <div className="mt-5 space-y-3">
                                    {result.proof.map((p, i) => (
                                        <div key={i} className="rounded-xl border border-white/10 bg-zinc-900/30 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-white/50">Step {i + 1}</div>
                                                <span className="text-[11px] rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
                          {p.leftSibling ? "Left sibling" : "Right sibling"}
                        </span>
                                            </div>
                                            <div className="mt-2 font-mono text-[11px] break-all text-white/75">
                                                {p.siblingHash}
                                            </div>
                                            <div className="mt-2 text-[11px] text-white/45">
                                                {shortHash(p.siblingHash, 12)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function InfoCard({ label, value, mono }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-4">
            <div className="text-xs text-white/50">{label}</div>
            <div className={["mt-1 text-sm text-white/85", mono ? "font-mono text-xs break-all" : ""].join(" ")}>
                {value}
            </div>
        </div>
    );
}
