/*
 * Endpoint: OVS.getAdminElectionResults({ electionId })
 * (same backend endpoint serves both voter + admin views; voter view just omits admin-only toolbar)
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar } from "../../ui/AppShell";
import { Btn, CopyButton, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";

export default function VoterResults() {
  const { id } = useParams();
  const [r, setR] = useState(null);

  useEffect(() => {
    withUnwrap(OVS.getAdminElectionResults({ electionId: id })).then(setR).catch(() => {});
  }, [id]);

  if (!r) return <AppShell role="voter" active="/voter/elections"><Topbar title="Results" /><div className="p-8 ink-3 text-sm">Loading…</div></AppShell>;

  const positions = Object.entries(r.resultsByPosition || {});
  const firstPosWinner = positions[0]?.[1]?.find(x => x.winner);
  const published = r.status === "published";
  const merkleRoot = r.merkleRootB64 || r.merkleRoot;
  const turnout    = (r.turnoutPercent != null) ? Number(r.turnoutPercent).toFixed(1) : null;
  const ballotsCast = r.ballotsCast ?? r.votedCount ?? 0;

  return (
    <AppShell role="voter" active="/voter/elections">
      <Topbar
        title="Results"
        crumbs={[
          { label: "Elections", path: "/voter/elections" },
          { label: r.electionName, path: `/voter/election/${id}` },
          { label: "Results" }
        ]}
      />
      <div className="p-8 max-w-4xl mx-auto">
        {/* Publication masthead */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${published ? "grad-primary text-white" : "grad-soft coral"}`}>
              <Icon name={published ? "check-circle" : "clock"} className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="chip" style={{ background: published ? "rgba(232,93,117,0.12)" : "var(--surface-2)", color: published ? "var(--coral)" : "var(--ink-2)" }}>
                  {published ? "Declared" : "Provisional"}
                </span>
                <StatusPill status={r.status} />
              </div>
              <div className="display text-2xl font-bold mb-1">{r.electionName}</div>
              {firstPosWinner && (
                <p className="ink-2 text-sm max-w-xl">
                  <span className="font-semibold ink">{firstPosWinner.fullName}</span> wins {positions[0][0]} with <span className="font-semibold coral">{firstPosWinner.voteSharePercent}%</span> of the vote
                  {firstPosWinner.marginOverRunnerUp ? <> — margin of {firstPosWinner.marginOverRunnerUp.toLocaleString()} ballots.</> : "."}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t hairline">
            <Stat label="Published"   value={r.publishedAt ? fmtDateTime(r.publishedAt) : "—"} mono />
            <Stat label="Eligible"    value={Number(r.totalVoters || 0).toLocaleString()} />
            <Stat label="Ballots"     value={Number(ballotsCast).toLocaleString()} tone="coral" />
            <Stat label="Turnout"     value={turnout != null ? `${turnout}%` : "—"} />
          </div>
        </div>

        {/* Per-position winner hero cards */}
        {positions.map(([pos, rows]) => {
          const winner = rows.find(x => x.winner);
          return (
            <section key={pos} className="mb-6">
              <div className="text-xs ink-3 uppercase tracking-widest mb-2">{pos}</div>
              {winner && (
                <div className="card p-5 mb-3 grad-primary text-white flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Icon name="trophy" className="w-7 h-7" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase opacity-80 tracking-widest">Winner</div>
                    <div className="display text-xl font-semibold">{winner.fullName}</div>
                    <div className="text-xs opacity-90">{winner.voteSharePercent}% · {winner.votes?.toLocaleString()} ballots</div>
                  </div>
                  <span className="chip" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                    Margin +{winner.marginPercent}%
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                {rows.map(row => (
                  <div key={row.candidateId} className="card p-3 flex items-center gap-3">
                    <div className="w-8 text-center font-semibold ink-3">{row.rank}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{row.fullName}</div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-2)] mt-1 overflow-hidden">
                        <div className={row.winner ? "grad-primary" : ""} style={{ height: "100%", width: `${row.voteSharePercent}%`, background: row.winner ? undefined : "var(--ink-3)" }} />
                      </div>
                    </div>
                    <div className="mono text-xs tabular-nums text-right">
                      <div>{row.votes?.toLocaleString()}</div>
                      <div className="ink-3 text-[10px]">{row.voteSharePercent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Integrity anchor */}
        <div className="card p-6 mt-6 grad-navy text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Icon name="shield-check" className="w-6 h-6" /></div>
            <div className="flex-1">
              <div className="display text-lg font-semibold mb-1">Verify this result</div>
              <p className="text-sm text-white/75 mb-4">These totals are computed by hashing every ballot into a Merkle tree. The root is published below — use it to verify any receipt.</p>
              <div className="p-3 rounded-xl mono text-xs break-all mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>{merkleRoot || "Not yet finalised"}</div>
              <div className="flex flex-wrap gap-2">
                <Link to="/verify-receipt" className="btn" style={{ background: "white", color: "var(--navy)", fontWeight: 600 }}>
                  <Icon name="shield-check" className="w-4 h-4" /> Verify a receipt
                </Link>
                {r.shareUrl && (
                  <CopyButton text={r.shareUrl} className="btn" >
                    <Icon name="link" className="w-4 h-4" /> Share verification link
                  </CopyButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, mono, tone }) {
  return (
    <div>
      <div className="text-[10px] ink-3 uppercase tracking-widest">{label}</div>
      <div className={`font-semibold ${mono ? "mono text-xs mt-1" : "display text-base mt-0.5"} ${tone === "coral" ? "coral" : ""}`}>
        {value}
      </div>
    </div>
  );
}
