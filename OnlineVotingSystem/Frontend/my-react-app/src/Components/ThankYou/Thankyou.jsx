"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Copy, ShieldCheck, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../Service/GlobalState/appStore";

function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

function formatDate(d) {
    try {
        return new Date(d).toLocaleString();
    } catch {
        return String(d || "");
    }
}

function buildReceiptText({ electionName, electionId, createdAt, receiptToken, selections }) {
    const lines = [];
    lines.push("OVM Digital Vote Receipt");
    lines.push("--------------------------------------------------");
    if (electionName) lines.push(`Election: ${electionName}`);
    if (electionId) lines.push(`Election ID: ${electionId}`);
    if (createdAt) lines.push(`Timestamp: ${formatDate(createdAt)}`);
    lines.push("");
    lines.push(`Receipt Token: ${receiptToken || ""}`);
    lines.push("");
    lines.push("Selections:");
    (selections || []).forEach((s) => {
        lines.push(`- ${s.position}: ${s.candidateName}${s.party ? ` (${s.party})` : ""}`);
    });
    lines.push("");
    lines.push("Keep this receipt token to verify your vote inclusion when results are published.");
    return lines.join("\n");
}

export default function ThankYou() {
    const navigate = useNavigate();
    const { election } = useAppStore();

    const [receipt, setReceipt] = useState(null);
    const [ballot, setBallot] = useState(null);
    const [err, setErr] = useState(null);
    const [copied, setCopied] = useState(false);

    const electionId = election?.id || election || ballot?.electionId || receipt?.electionId;
    const electionName = election?.name || ballot?.electionName || "";

    useEffect(() => {
        // load receipt and ballot from sessionStorage
        try {
            const r = safeJsonParse(sessionStorage.getItem("vote_receipt"));
            const b = safeJsonParse(sessionStorage.getItem("ballot_review"));
            setReceipt(r);
            setBallot(b);

            if (!r?.receiptToken && !r?.receiptHashToken) {
                // depending on what your backend returns, adapt
                // recommended: { receiptToken } field name
                setErr({ message: "Missing receipt data. Please submit your vote first." });
            }
        } catch {
            setErr({ message: "Unable to load receipt. Please try again." });
        }
    }, []);

    // Build selections list from ballot_review
    const selections = useMemo(() => {
        if (!ballot?.selected || !Array.isArray(ballot?.candidates)) return [];

        // ballot.selected = { [positionName]: candidateId }
        const selectedMap = ballot.selected;
        const candidates = ballot.candidates;

        return Object.entries(selectedMap).map(([position, candidateId]) => {
            const c = candidates.find((x) => x.id === candidateId);
            const candidateName =
                (c && `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()) ||
                c?.name ||
                "Candidate";
            return {
                position,
                candidateName,
                party: c?.party || "",
            };
        });
    }, [ballot]);

    const receiptToken = receipt?.receiptToken || receipt?.receiptHashToken || receipt?.token || "";
    const createdAt = receipt?.createdAt || receipt?.timestamp || Date.now();

    const receiptText = useMemo(
        () =>
            buildReceiptText({
                electionName,
                electionId,
                createdAt,
                receiptToken,
                selections,
            }),
        [electionName, electionId, createdAt, receiptToken, selections]
    );

    function downloadTxt() {
        const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `OVM_Vote_Receipt_${(electionId || "Election").toString().slice(0, 8)}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function downloadJson() {
        const payload = {
            electionId,
            electionName,
            createdAt,
            receiptToken,
            selections,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `OVM_Vote_Receipt_${(electionId || "Election").toString().slice(0, 8)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    async function copyToken() {
        try {
            await navigator.clipboard.writeText(receiptToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setErr({ message: "Clipboard blocked by browser. You can manually select and copy the token." });
        }
    }

    function closeFlow() {
        // optional: clear election selection after vote is done
        // sessionStorage.clear(); // too aggressive
        navigate("/select"); // or home
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12 text-white">
            <div className="mx-auto w-full max-w-2xl">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-300" />
                        <span className="text-sm text-white/80">OVM • Receipt</span>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Thank you for voting</h1>
                    </div>

                    <p className="mt-2 text-sm text-white/60">
                        Your vote has been recorded. Save your receipt token to verify inclusion later.
                    </p>
                </div>

                {err && (
                    <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
                            <div>
                                <div className="font-semibold text-amber-200">Notice</div>
                                <div className="mt-1 text-sm text-white/80">{err.message}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {/* Meta */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-4">
                            <div className="text-xs text-white/50">Election</div>
                            <div className="mt-1 text-sm font-semibold text-white/90">
                                {electionName || (electionId ? `Election ID: ${electionId}` : "—")}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-4">
                            <div className="text-xs text-white/50">Timestamp</div>
                            <div className="mt-1 text-sm font-semibold text-white/90">{formatDate(createdAt)}</div>
                        </div>
                    </div>

                    {/* Token */}
                    <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-xs text-white/60">Receipt Token</div>
                                <div className="mt-1 break-all font-mono text-sm text-emerald-100">
                                    {receiptToken || "—"}
                                </div>
                                <div className="mt-2 text-[11px] text-white/50">
                                    This token is what you’ll use later to verify your vote inclusion.
                                </div>
                            </div>

                            <button
                                onClick={copyToken}
                                disabled={!receiptToken}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                            >
                                <Copy className="h-4 w-4" />
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Selections */}
                    <div className="mt-6">
                        <div className="mb-3 text-sm font-semibold text-indigo-200">Your selections</div>

                        {selections.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-white/60">
                                Selections are not available (this can happen if the review cache was cleared). Your receipt token is still valid.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selections.map((s, idx) => (
                                    <div
                                        key={`${s.position}-${idx}`}
                                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/30 p-4"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-white/90">{s.position}</div>
                                            <div className="mt-1 text-xs text-white/60">{s.party || "Independent"}</div>
                                        </div>
                                        <div className="text-right text-sm font-semibold text-white/90">{s.candidateName}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            onClick={downloadTxt}
                            disabled={!receiptToken}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-60"
                        >
                            <Download className="h-4 w-4" />
                            Download receipt (TXT)
                        </button>

                        <button
                            onClick={downloadJson}
                            disabled={!receiptToken}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                        >
                            <Download className="h-4 w-4" />
                            Download receipt (JSON)
                        </button>

                        <button
                            onClick={closeFlow}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-950/30 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-zinc-950/50"
                        >
                            Back to elections
                        </button>
                    </div>

                    <div className="mt-6 text-center text-[11px] text-white/40">
                        © {new Date().getFullYear()} OVM — Secure Online Voting System
                    </div>
                </div>
            </div>
        </div>
    );
}


