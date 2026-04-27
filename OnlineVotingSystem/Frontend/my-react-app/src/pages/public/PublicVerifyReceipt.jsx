/*
 * Endpoint: OVS.verifyReceipt({ receiptToken }) — POST /public/receipt/verify
 * Response: VerifyReceiptResponse {
 *   included, electionName, electionId, votedAt,
 *   merkleRootB64, leafHashB64, leafIndex, treeDepth,
 *   proofPath: [{ hash, side: "L" | "R" }]
 * }
 *
 * Query param `token` auto-fills the input so deep links from the post-vote screen land here.
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { Btn } from "../../ui/Primitives";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";

export default function PublicVerifyReceipt() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (params.get("token")) submit(); // auto-submit when deep-linked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e?.preventDefault();
    setErr(null); setResult(null); setLoading(true);
    try {
      const r = await withUnwrap(OVS.verifyReceipt({ receiptToken: token.trim() }));
      setResult(r);
    } catch (e) {
      setErr(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="max-w-3xl mx-auto px-6 py-14">
        <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">Public receipt check</div>
        <h1 className="display text-4xl font-bold mb-3">Verify a ballot against the Merkle root.</h1>
        <p className="text-lg ink-2 mb-8 max-w-2xl">
          Paste any receipt token below. We'll show you the ballot's leaf hash, the computed
          Merkle proof path, and the published root. If any byte has changed, the check fails.
        </p>

        <form onSubmit={submit} className="card p-5 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[260px]">
            <div className="text-xs ink-3 uppercase tracking-widest mb-1.5">Receipt token</div>
            <input
              value={token} onChange={e => setToken(e.target.value)}
              placeholder="tv-xxxxxxxx-xxxxxxxx-xxxx"
              className="w-full px-3 py-2.5 rounded-xl mono text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
            />
          </div>
          <Btn type="submit" variant="primary" disabled={loading || !token}>
            <Icon name="shield-check" className="w-4 h-4" /> {loading ? "Verifying…" : "Verify"}
          </Btn>
        </form>

        {err && <div className="card p-4 mb-6 border-[var(--err)]/40 bg-[rgba(193,69,69,0.05)] text-sm text-[var(--err)]">{err}</div>}

        {result && <Result r={result} />}
      </section>
    </PublicShell>
  );
}

function Result({ r }) {
  // Backend canonical names: `included`, `votedAt`, `merkleRootB64`, `leafHashB64`.
  // Older builds returned `valid` / `castAt` / `merkleRoot` / `leafHash`; we
  // accept both so this page survives a partial deploy.
  const ok        = r.included ?? r.valid;
  const castAt    = r.votedAt   ?? r.castAt;
  const merkle    = r.merkleRootB64 ?? r.merkleRoot;
  const leaf      = r.leafHashB64   ?? r.leafHash;
  const proofPath = Array.isArray(r.proofPath) ? r.proofPath : [];

  return (
    <div className={`card p-6 ${ok ? "" : "border-[var(--err)]/40"}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ok ? "grad-primary text-white" : ""}`}
             style={!ok ? { background: "rgba(193,69,69,0.12)", color: "var(--err)" } : {}}>
          <Icon name={ok ? "shield-check" : "shield-x"} className="w-6 h-6" />
        </div>
        <div>
          <div className="display text-xl font-semibold">{ok ? "Receipt is valid." : "Receipt does not verify."}</div>
          <div className="text-sm ink-2">
            {ok
              ? "This ballot is part of the published Merkle root."
              : "The leaf does not match any path to the published root."}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm mb-5">
        <InfoRow label="Election"    value={r.electionName || "—"} />
        <InfoRow label="Cast at"     value={castAt ? fmtDateTime(castAt) : "—"} />
        <InfoRow label="Leaf hash"   value={leaf || "—"}   mono />
        <InfoRow label="Merkle root" value={merkle || "—"} mono />
        {Number.isFinite(r.leafIndex) && (
          <InfoRow label="Leaf index" value={`${r.leafIndex}${r.treeDepth ? ` of depth ${r.treeDepth}` : ""}`} mono />
        )}
      </div>

      <details className="border-t hairline pt-4" {...(proofPath.length > 0 ? { open: false } : {})}>
        <summary className="text-sm font-semibold cursor-pointer">
          Merkle proof path ({proofPath.length} {proofPath.length === 1 ? "level" : "levels"})
        </summary>
        {proofPath.length === 0
          ? <div className="text-xs ink-3 mt-3">No siblings — this leaf is the root (single-ballot tree).</div>
          : <ol className="mt-3 space-y-1.5 text-xs mono">
              {proofPath.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="ink-3 w-10">L{i}</span>
                  <span className="chip" style={{ background: "var(--surface-2)" }}>{p.side || "?"}</span>
                  <span className="break-all ink-2">{p.hash}</span>
                </li>
              ))}
            </ol>
        }
      </details>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] ink-3 uppercase tracking-widest mb-0.5">{label}</div>
      <div className={`font-medium break-all ${mono ? "mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}
