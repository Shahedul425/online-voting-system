// src/pages/voter/ReceiptVerification.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { VoterShell } from "../layout/PubliceLayout";
import { Panel, Btn, ErrorBanner, HintBox, Chip } from "../ui";

function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : new Intl.DateTimeFormat(undefined, {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(d);
}

export default function ReceiptVerification() {
    const navigate = useNavigate();

    const [token, setToken]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [result, setResult]     = useState(null); // VerifyReceiptResponse
    const [copied, setCopied]     = useState(false);

    const canVerify = useMemo(() => token.trim().length > 10, [token]);

    async function verify() {
        setError(null);
        setResult(null);
        if (!token.trim()) return;

        setLoading(true);
        // POST /public/receipt/verify → VerifyReceiptRequest { receiptToken }
        const res = await OVS.verifyReceipt({ receiptToken: token.trim() });
        setLoading(false);

        if (!res.ok) { setError(toAppError(res)); return; }
        setResult(res.data);
    }

    async function copyRoot() {
        try { await navigator.clipboard.writeText(result?.merkleRootB64 ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
    }

    return (
        <VoterShell wide>
            <div className="flex items-start justify-between gap-4 flex-wrap animate-up">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={18} style={{ color: "var(--purple)" }} />
                        <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Public · No login required</span>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Verify Your Vote</h1>
                    <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4, maxWidth: 500 }}>
                        Paste your receipt token to confirm it's included in the published Merkle root for that election.
                    </p>
                </div>
                <Btn variant="primary" loading={loading} disabled={!canVerify} onClick={verify}>
                    🔍 Verify →
                </Btn>
            </div>

            <ErrorBanner error={error} onClose={() => setError(null)} />

            {/* Input */}
            <Panel title="Receipt Token" subtitle="POST /public/receipt/verify · VerifyReceiptRequest" className="animate-up-2">
                <div className="flex flex-col gap-3">
          <textarea
              value={token}
              onChange={e => { setToken(e.target.value); setResult(null); setError(null); }}
              placeholder="Paste receipt token here (payload.signature)"
              rows={4}
              style={{
                  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8,
                  padding: "10px 14px", color: "var(--t1)", fontSize: 11, fontFamily: "JetBrains Mono",
                  outline: "none", width: "100%", resize: "vertical",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--purple-b)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border)")}
          />
                    <HintBox type="info">
                        The election ID is embedded and signed inside the token — no need to provide it separately.
                        The token was issued when you cast your ballot via <span className="mono">POST /voter/vote/cast</span>.
                    </HintBox>
                    <div className="flex justify-end">
                        <Btn variant="primary" loading={loading} disabled={!canVerify} onClick={verify}>
                            🔍 Verify →
                        </Btn>
                    </div>
                </div>
            </Panel>

            {/* Result */}
            {result && (
                <div className="grid gap-4 animate-up-2" style={{ gridTemplateColumns: "1fr 280px" }}>
                    {/* Left */}
                    <div className="flex flex-col gap-4">
                        {/* Verdict */}
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: result.included ? "var(--green-d)" : "var(--red-d)",
                                border: `1px solid ${result.included ? "var(--green-b)" : "rgba(247,111,111,.2)"}`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                {result.included
                                    ? <CheckCircle2 size={22} style={{ color: "var(--green)", flexShrink: 0 }} />
                                    : <XCircle     size={22} style={{ color: "var(--red)",   flexShrink: 0 }} />
                                }
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: result.included ? "var(--green)" : "var(--red)" }}>
                                        {result.included ? "Included in Merkle root" : "Not included"}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3 }}>
                                        {result.included
                                            ? "✅ Your receipt is cryptographically proven to be part of the published election commitment."
                                            : "❌ This receipt could not be proven against the published commitment."}
                                    </div>
                                </div>
                                <Btn variant="ghost" size="sm" onClick={() => { setResult(null); setToken(""); }} className="ml-auto">Clear</Btn>
                            </div>
                        </div>

                        {/* Details */}
                        <Panel title="Verification Details">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[
                                    ["Election",        result.electionName || "—",       false],
                                    ["Voted at",        fmtDate(result.votedAt),           false],
                                    ["Election ID",     result.electionId || "—",          true],
                                    ["Organization ID", result.organizationId || "—",      true],
                                ].map(([l, v, mono]) => (
                                    <div key={l} className="rounded-xl px-4 py-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: 10.5, color: "var(--t3)", marginBottom: 4 }}>{l}</div>
                                        <div style={{ fontSize: mono ? 11 : 12.5, fontFamily: mono ? "JetBrains Mono" : "inherit", fontWeight: 600, color: "var(--t1)", wordBreak: "break-all" }}>
                                            {String(v)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>

                        {/* Merkle commitment */}
                        <Panel title="Merkle Commitment" action={
                            <Btn variant="ghost" size="sm" onClick={copyRoot}>
                                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy root</>}
                            </Btn>
                        }>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 6 }}>
                                merkleRootB64
                            </div>
                            <div style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--cyan)", wordBreak: "break-all", lineHeight: 1.7, marginBottom: 12 }}>
                                {result.merkleRootB64 || "—"}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    ["Leaf index",   result.leafIndex  ?? "—"],
                                    ["Tree depth",   result.treeDepth  ?? "—"],
                                    ["Proof steps",  result.proof?.length ?? 0],
                                ].map(([l, v]) => (
                                    <Chip key={l} variant="purple">{l}: {v}</Chip>
                                ))}
                            </div>
                        </Panel>
                    </div>

                    {/* Right: proof path */}
                    <Panel title="Proof Path" subtitle={`${result.proof?.length ?? 0} steps`} className="h-fit sticky top-4">
                        <p style={{ fontSize: 11.5, color: "var(--t3)", marginBottom: 12 }}>
                            Sibling hashes used to recompute the root from your leaf. You can verify locally.
                        </p>
                        {!Array.isArray(result.proof) || result.proof.length === 0 ? (
                            <div style={{ fontSize: 12, color: "var(--t3)" }}>No proof returned.</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {result.proof.map((p, i) => (
                                    <div key={i} className="rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                        <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--t3)" }}>
                        Step {i + 1}
                      </span>
                                            <Chip variant={p.leftSibling ? "cyan" : "purple"} >{p.leftSibling ? "Left sibling" : "Right sibling"}</Chip>
                                        </div>
                                        <div style={{ fontSize: 9, fontFamily: "JetBrains Mono", color: "var(--t2)", wordBreak: "break-all", lineHeight: 1.6 }}>
                                            {p.siblingHash}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            )}
        </VoterShell>
    );
}

