/*
 * Full receipt view — shown from VoteSubmitted's "View full receipt" CTA,
 * or via direct link from the voter's email.
 *
 * This page loads the full VerifyReceiptResponse shape from the backend.
 * Endpoint: OVS.verifyReceipt({ receiptToken }) — POST /public/receipt/verify
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar } from "../../ui/AppShell";
import { Btn, CopyButton } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { ReceiptStore } from "../../lib/receiptStore";
import { fmtDateTime } from "../../lib/format";

export default function VoterReceipt() {
  const { id } = useParams();
  const [stored] = useState(ReceiptStore.get());
  const [el, setEl] = useState(null);
  const [verified, setVerified] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    withUnwrap(OVS.getVoterElectionById({ id })).then(setEl).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!stored?.receiptToken || stored.electionId !== id) return;
    withUnwrap(OVS.verifyReceipt({ receiptToken: stored.receiptToken }))
      .then(setVerified).catch(e => setErr(e?.message || "Verification failed"));
  }, [stored, id]);

  if (!stored || stored.electionId !== id) {
    return (
      <AppShell role="voter" active="/voter/elections">
        <Topbar title="No receipt" />
        <div className="p-8 max-w-lg mx-auto text-center">
          <div className="ink-2 mb-4">No receipt in this session.</div>
          <Link to="/verify-receipt" className="btn btn-ghost"><Icon name="shield-check" className="w-4 h-4" /> Verify a token</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="voter" active="/voter/elections">
      <Topbar
        title="Ballot receipt"
        crumbs={[
          { label: "Elections", path: "/voter/elections" },
          ...(el ? [{ label: el.name, path: `/voter/election/${id}` }] : []),
          { label: "Receipt" }
        ]}
      />
      <div className="p-8 max-w-3xl mx-auto">
        <div className="card p-0 overflow-hidden mb-6">
          <div className="grad-primary text-white p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Icon name="file-check-2" className="w-7 h-7" /></div>
            <div>
              <div className="display text-2xl font-bold">
                {verified == null
                  ? "Receipt stored"
                  : (verified.included ?? verified.valid)
                    ? "Receipt verified"
                    : "Not yet anchored"}
              </div>
              <div className="text-sm opacity-90 mt-1">
                {verified == null
                  ? "Looking up against the tree…"
                  : (verified.included ?? verified.valid)
                    ? "Anchored to the published Merkle root."
                    : "Your receipt is recorded but the election hasn't been published yet."}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs ink-3 uppercase tracking-widest mb-2">Receipt token</div>
            <div className="p-4 rounded-xl surface-2 mono text-sm break-all border hairline mb-3">{stored.receiptToken}</div>
            <CopyButton text={stored.receiptToken} className="btn btn-ghost w-full justify-center">
              <Icon name="copy" className="w-4 h-4" /> Copy receipt
            </CopyButton>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs ink-3 mb-0.5">Election</div><div className="font-medium">{el?.name || "—"}</div></div>
              <div><div className="text-xs ink-3 mb-0.5">Submitted</div><div className="font-medium mono text-xs">{fmtDateTime(stored.createdAt)}</div></div>
              {verified && <>
                <div><div className="text-xs ink-3 mb-0.5">Leaf hash</div><div className="font-medium mono text-xs break-all">{verified.leafHashB64 ?? verified.leafHash ?? "—"}</div></div>
                <div><div className="text-xs ink-3 mb-0.5">Merkle root</div><div className="font-medium mono text-xs break-all">{verified.merkleRootB64 ?? verified.merkleRoot ?? "—"}</div></div>
              </>}
            </div>
          </div>
        </div>

        {err && <div className="card p-4 mb-4 border-[var(--err)]/40 text-sm text-[var(--err)]">{err}</div>}

        <div className="flex gap-3">
          <Link to={`/verify-receipt?token=${stored.receiptToken}`} className="btn btn-navy flex-1"><Icon name="shield-check" className="w-4 h-4" />Verify on public page</Link>
          <Link to="/voter/dashboard" className="btn btn-ghost flex-1"><Icon name="home" className="w-4 h-4" />Dashboard</Link>
        </div>
      </div>
    </AppShell>
  );
}
