// src/pages/voter/ThankYou.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Download, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { VoterShell } from "../layout/PubliceLayout";
import { Panel, Btn, InfoRow } from "../ui";

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }
function fmtDate(v) { try { return new Date(v).toLocaleString(); } catch { return String(v || ""); } }

export default function ThankYou() {
    const navigate   = useNavigate();
    const { election } = useAppStore();

    const [receipt, setReceipt] = useState(null);
    const [ballot,  setBallot]  = useState(null);
    const [err,     setErr]     = useState(null);
    const [copied,  setCopied]  = useState(false);

    useEffect(() => {
        try {
            const r = safeJson(sessionStorage.getItem("vote_receipt"));
            const b = safeJson(sessionStorage.getItem("ballot_review"));
            setReceipt(r);
            setBallot(b);
            if (!r?.receiptToken && !r?.receiptHashToken) {
                setErr({ message: "Missing receipt data. Please submit your vote first." });
            }
        } catch {
            setErr({ message: "Unable to load receipt." });
        }
    }, []);

    const receiptToken = receipt?.receiptToken || receipt?.receiptHashToken || receipt?.token || "";
    const createdAt    = receipt?.createdAt || receipt?.timestamp || Date.now();
    const electionName = election?.name || ballot?.electionName || "";
    const electionId   = election?.id   || ballot?.electionId   || receipt?.electionId;

    const selections = useMemo(() => {
        if (!ballot?.selected || !Array.isArray(ballot?.candidates)) return [];
        return Object.entries(ballot.selected).map(([position, candidateId]) => {
            const c = ballot.candidates.find(x => x.id === candidateId);
            const name = (c && `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()) || c?.name || "Candidate";
            return { position, name, party: c?.party || "" };
        });
    }, [ballot]);

    async function copyToken() {
        try { await navigator.clipboard.writeText(receiptToken); setCopied(true); setTimeout(() => setCopied(false), 1500); }
        catch { setErr({ message: "Clipboard blocked by browser. Select and copy the token manually." }); }
    }

    function download(type) {
        const filename = `OVS_Receipt_${String(electionId || "Election").slice(0, 8)}`;
        if (type === "txt") {
            const lines = [
                "OVS Digital Vote Receipt",
                "─".repeat(48),
                electionName && `Election: ${electionName}`,
                electionId   && `Election ID: ${electionId}`,
                `Timestamp: ${fmtDate(createdAt)}`,
                "",
                `Receipt Token: ${receiptToken}`,
                "",
                "Selections:",
                ...selections.map(s => `  - ${s.position}: ${s.name}${s.party ? ` (${s.party})` : ""}`),
                "",
                "Keep this token to verify your vote inclusion when results are published.",
            ].filter(Boolean);
            const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".txt"; a.click(); URL.revokeObjectURL(a.href);
        } else {
            const payload = { electionId, electionName, createdAt, receiptToken, selections };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".json"; a.click(); URL.revokeObjectURL(a.href);
        }
    }

    return (
        <VoterShell>
            {/* Hero */}
            <div className="flex flex-col items-center text-center animate-up">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-[28px] mb-4"
                    style={{ background: "var(--green-d)", border: "2px solid var(--green-b)" }}
                >✓</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>Thank you for voting</h1>
                <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 6, maxWidth: 400, lineHeight: 1.7 }}>
                    Your vote has been recorded and cryptographically sealed. Save your receipt token to verify inclusion when results are published.
                </p>
            </div>

            {err && (
                <div className="rounded-xl px-4 py-3 flex items-start gap-3 animate-up"
                     style={{ background: "var(--orange-d)", border: "1px solid rgba(247,166,77,.25)" }}>
                    <AlertTriangle size={16} style={{ color: "var(--orange)", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: "var(--t2)" }}>{err.message}</div>
                </div>
            )}

            {/* Receipt card */}
            <div
                className="relative overflow-hidden rounded-xl p-5 animate-up-2"
                style={{ background: "var(--surface)", border: "1px solid var(--green-b)" }}
            >
                {/* glow */}
                <div className="absolute pointer-events-none" style={{ top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "var(--green)", opacity: .05 }} />

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 3 }}>Election</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--t1)" }}>
                            {electionName || (electionId ? `ID: ${String(electionId).slice(0,8)}` : "—")}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                         style={{ background: "var(--green-d)", color: "var(--green)", border: "1px solid var(--green-b)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                        Vote recorded
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {[["Timestamp", fmtDate(createdAt)], ["Selections", `${selections.length} positions`]].map(([l,v]) => (
                        <div key={l} className="rounded-lg px-3 py-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 4 }}>{l}</div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{v}</div>
                        </div>
                    ))}
                </div>

                {/* Token */}
                <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 6 }}>
                        Receipt Token · receiptToken
                    </div>
                    <div
                        className="rounded-lg px-3 py-3 mb-3"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--cyan)", wordBreak: "break-all", lineHeight: 1.7 }}
                    >
                        {receiptToken || "—"}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Btn variant="primary" onClick={copyToken} className="flex-1">
                        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Token</>}
                    </Btn>
                    <Btn variant="ghost" onClick={() => download("txt")} className="flex-1">
                        <Download size={12} /> TXT
                    </Btn>
                    <Btn variant="ghost" onClick={() => download("json")} className="flex-1">
                        <Download size={12} /> JSON
                    </Btn>
                </div>
            </div>

            {/* Selections */}
            {selections.length > 0 && (
                <Panel title="Your Selections" className="animate-up-3">
                    {selections.map((s, i) => (
                        <div
                            key={`${s.position}-${i}`}
                            className="flex items-center justify-between py-2.5"
                            style={{ borderBottom: i < selections.length - 1 ? "1px solid var(--border)" : "none" }}
                        >
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)" }}>{s.position}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginTop: 3 }}>{s.name}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--t3)" }}>{s.party || "Independent"}</div>
                        </div>
                    ))}
                </Panel>
            )}

            <div className="flex gap-3 justify-center animate-up-4">
                <Btn variant="ghost" size="lg" onClick={() => navigate("/select")}>← Back to Elections</Btn>
                <Btn variant="ghost" size="lg" onClick={() => navigate("/verify/receipt")}>Verify Receipt →</Btn>
            </div>
        </VoterShell>
    );
}
