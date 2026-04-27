/*
 * AdminResults — admin view of an election's published / closed results.
 *
 * Backend: GET /admin/election/{electionId}/results → ElectionResultsResponse
 *   {
 *     electionId, electionName, electionType, organizationId, organizationName,
 *     status, createdAt, startTime, endTime, publishedAt,
 *     merkleRootB64,
 *     totalVoters, votedCount, turnoutPercent, ballotsCast,
 *     resultsByPosition: { [position]: CandidateResultRow[] },
 *     turnoutTimeline, firstBallotAt, lastBallotAt, peakHour, shareUrl
 *   }
 *
 * Renders a publication masthead (KPIs + Merkle root + published-at), then the
 * per-position winners + ranked rosters, then the auditor bundle CTA.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell, { Topbar } from "../../ui/AppShell";
import { Btn, CopyButton, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";

export default function AdminResults() {
  const { id } = useParams();
  const [r, setR] = useState(null);

  useEffect(() => {
    withUnwrap(OVS.getAdminElectionResults({ electionId: id })).then(setR).catch(() => {});
  }, [id]);

  if (!r) return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar title="Results" />
      <div className="p-8 ink-3 text-sm">Loading…</div>
    </AppShell>
  );

  const positions = Object.entries(r.resultsByPosition || {});
  const merkleRoot = r.merkleRootB64 || r.merkleRoot;
  const turnout = (r.turnoutPercent != null) ? Number(r.turnoutPercent).toFixed(1) : null;
  const totalVoters = r.totalVoters ?? 0;
  const votedCount  = r.votedCount  ?? 0;
  const ballotsCast = r.ballotsCast ?? votedCount;

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title={`Results — ${r.electionName || ""}`}
        crumbs={[
          { label: "Elections", path: "/admin/elections" },
          { label: r.electionName, path: `/admin/elections/${id}` },
          { label: "Results" },
        ]}
        right={<StatusPill status={r.status} />}
      />
      <div className="p-8 max-w-5xl mx-auto">
        {/* Publication masthead — date published, turnout, ballots, merkle root */}
        <div className="card p-6 mb-5">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <KpiTile
              icon="calendar-check"
              label="Published"
              value={r.publishedAt ? fmtDateTime(r.publishedAt) : "Not yet published"}
              mono
            />
            <KpiTile
              icon="users"
              label="Eligible"
              value={Number(totalVoters).toLocaleString()}
            />
            <KpiTile
              icon="file-check-2"
              label="Ballots cast"
              value={Number(ballotsCast).toLocaleString()}
              tone="coral"
            />
            <KpiTile
              icon="activity"
              label="Turnout"
              value={turnout != null ? `${turnout}%` : "—"}
            />
          </div>

          <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">Merkle root</div>
          <div
            className="p-3 rounded-xl mono text-xs break-all"
            style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
          >
            {merkleRoot || "Not yet finalised — root is anchored when results are published."}
          </div>
          {(r.firstBallotAt || r.lastBallotAt || r.peakHour) && (
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              {r.firstBallotAt && <MiniRow label="First ballot" value={fmtDateTime(r.firstBallotAt)} mono />}
              {r.lastBallotAt  && <MiniRow label="Last ballot"  value={fmtDateTime(r.lastBallotAt)}  mono />}
              {r.peakHour      && <MiniRow label="Peak hour"    value={r.peakHour} />}
            </div>
          )}
        </div>

        {/* Closed-but-not-published banner */}
        {r.status === "closed" && (
          <div className="card p-4 mb-5 flex items-center gap-3 grad-soft">
            <Icon name="alert-circle" className="w-5 h-5 coral shrink-0" />
            <div className="flex-1 text-sm">
              This election is closed but not yet published. Numbers below are admin-only and will become public once you publish.
            </div>
          </div>
        )}

        {/* Per-position winner hero cards */}
        {positions.length === 0 && (
          <div className="card p-8 text-center ink-3 text-sm">
            No results to show yet.
          </div>
        )}
        {positions.map(([pos, rows]) => {
          const winner = rows.find(x => x.winner);
          return (
            <section key={pos} className="mb-6">
              <div className="text-xs ink-3 uppercase tracking-widest mb-2">{pos}</div>
              {winner && (
                <div className="card p-5 mb-3 grad-primary text-white flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon name="trophy" className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase opacity-80 tracking-widest">Winner</div>
                    <div className="display text-xl font-semibold">{winner.fullName}</div>
                    <div className="text-xs opacity-90">
                      {winner.voteSharePercent}% · {Number(winner.votes || 0).toLocaleString()} ballots
                    </div>
                  </div>
                  {winner.marginPercent != null && (
                    <span className="chip" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                      Margin +{winner.marginPercent}%
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                {rows.map(row => (
                  <div key={row.candidateId} className="card p-3 flex items-center gap-3">
                    <div className="w-8 text-center font-semibold ink-3">{row.rank}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{row.fullName}</div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-2)] mt-1 overflow-hidden">
                        <div
                          style={{
                            height: "100%",
                            width: `${Number(row.voteSharePercent || 0)}%`,
                            background: row.winner ? "var(--coral)" : "var(--t3)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="mono text-xs tabular-nums text-right">
                      <div>{Number(row.votes || 0).toLocaleString()}</div>
                      <div className="ink-3 text-[10px]">{row.voteSharePercent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Audit bundle */}
        <div className="card p-6 mt-6 grad-navy text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Icon name="package" className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="display text-lg font-semibold mb-1">Audit bundle</div>
              <p className="text-sm text-white/75 mb-4">
                Downloadable ZIP with CSV roll hashes, candidate hashes, Merkle root, and all audit rows. Share with auditors.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn"
                  style={{ background: "white", color: "var(--navy)", fontWeight: 600 }}
                  onClick={() => window.open(`/admin/election/${id}/auditBundle.zip`, "_blank")}
                >
                  <Icon name="download" className="w-4 h-4" /> Download bundle
                </button>
                {r.shareUrl && (
                  <CopyButton text={r.shareUrl} className="btn">
                    <Icon name="link" className="w-4 h-4" /> Copy public verify link
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

function KpiTile({ icon, label, value, tone, mono }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone === "coral" ? "grad-soft coral" : "surface-2"}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] ink-3 uppercase tracking-widest">{label}</div>
        <div className={`font-semibold ${mono ? "mono text-xs mt-1" : "display text-xl mt-0.5"}`}>{value}</div>
      </div>
    </div>
  );
}

function MiniRow({ label, value, mono }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="ink-3 uppercase tracking-widest">{label}</span>
      <span className={mono ? "mono" : ""} style={{ color: "var(--t1)" }}>{value}</span>
    </div>
  );
}
