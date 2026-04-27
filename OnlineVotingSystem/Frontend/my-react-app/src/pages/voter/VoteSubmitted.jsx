/*
 * Confirmation page shown IMMEDIATELY after /voter/vote/cast returns.
 * Uses ReceiptStore (sessionStorage) to pick up the token the ballot page just set.
 * No extra API call — the user just cast a vote, show them the receipt.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell, { Topbar } from "../../ui/AppShell";
import { Btn, CopyButton } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { ReceiptStore } from "../../lib/receiptStore";
import { fmtDateTime, short } from "../../lib/format";

export default function VoteSubmitted() {
  const { id } = useParams();
  const nav = useNavigate();
  const [el, setEl] = useState(null);
  const r = ReceiptStore.get();

  useEffect(() => {
    withUnwrap(OVS.getVoterElectionById({ id })).then(setEl).catch(() => {});
  }, [id]);

  if (!r || r.electionId !== id) {
    return (
      <AppShell role="voter" active="/voter/elections">
        <Topbar title="No ballot submitted" />
        <div className="p-8 max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl surface-2 mx-auto flex items-center justify-center mb-3">
            <Icon name="info" className="w-6 h-6 ink-3" />
          </div>
          <div className="display text-lg font-semibold mb-1">No recent ballot in this session</div>
          <div className="ink-2 text-sm mb-6">If you already voted, check your receipt from the verify page.</div>
          <Btn onClick={() => nav("/voter/elections")} icon="arrow-left">Back to elections</Btn>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="voter" active="/voter/elections">
      <Topbar
        title="Vote submitted"
        crumbs={[
          { label: "Elections", path: "/voter/elections" },
          ...(el ? [{ label: el.name, path: `/voter/election/${id}` }] : []),
          { label: "Submitted" }
        ]}
      />
      <div className="p-8 max-w-2xl mx-auto pb-16">
        {/* Celebration hero */}
        <div className="card p-0 overflow-hidden mb-6 shadow-lift">
          <div className="grad-primary text-white p-8 text-center relative" style={{ overflow: "hidden" }}>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 40%)"
            }} />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 animate-pop">
                <Icon name="check" className="w-10 h-10" strokeWidth={3} />
              </div>
              <div className="display text-3xl font-bold mb-2">Your vote is in.</div>
              <div className="text-sm opacity-90 max-w-md mx-auto">
                Your ballot was cryptographically separated from your identity, committed to the Merkle tree,
                and recorded in the audit log — all in the same database transaction.
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              <div>
                <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">Election</div>
                <div className="font-semibold">{el?.name || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">Submitted</div>
                <div className="font-semibold mono text-xs">{fmtDateTime(r.createdAt)}</div>
              </div>
            </div>

            <div className="rounded-xl surface-2 p-4 border hairline">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] ink-3 uppercase tracking-widest">Your receipt token</div>
                <span className="chip" style={{ background: "rgba(232,93,117,0.1)", color: "var(--coral)" }}>save this</span>
              </div>
              <div className="mono text-sm break-all mb-3">{r.receiptToken}</div>
              <CopyButton text={r.receiptToken} className="btn btn-ghost w-full justify-center">
                <Icon name="copy" className="w-4 h-4" /> Copy receipt token
              </CopyButton>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg grad-soft coral flex items-center justify-center"><Icon name="list-checks" className="w-4 h-4" /></div>
            <div className="font-semibold display">What happens next</div>
          </div>
          <ol className="space-y-3 text-sm">
            <Step n={1} title="Your ballot is anchored when voting closes." body="The Merkle root is finalised at close. Until then the receipt is committed but not yet anchored." primary />
            <Step n={2} title="You'll get an email when verification opens." body="Paste your receipt into the verify page; we'll show you the Merkle proof and match it to the published root." />
            <Step n={3} title="Results are published publicly." body="Anyone can audit totals against the Merkle root — no login required." />
          </ol>
        </div>

        {/* Next actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={`/voter/receipt/${id}`} className="btn btn-primary"><Icon name="file-text" className="w-4 h-4" />View full receipt</Link>
          <Link to={`/verify-receipt?token=${r.receiptToken}`} className="btn btn-navy"><Icon name="shield-check" className="w-4 h-4" />Verify now</Link>
          <Link to="/voter/elections" className="btn btn-ghost"><Icon name="arrow-left" className="w-4 h-4" />Back to elections</Link>
          <Link to="/voter/dashboard" className="btn btn-ghost"><Icon name="home" className="w-4 h-4" />Dashboard</Link>
        </div>

        <div className="text-center mt-6 text-xs ink-3">
          Session-sealed · {short(r.receiptToken, 12)}…
        </div>
      </div>
    </AppShell>
  );
}

function Step({ n, title, body, primary = false }) {
  return (
    <li className="flex gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${primary ? "grad-primary text-white" : "grad-soft coral"}`}>{n}</div>
      <div><div className="font-medium">{title}</div><div className="ink-2 text-xs mt-0.5">{body}</div></div>
    </li>
  );
}
