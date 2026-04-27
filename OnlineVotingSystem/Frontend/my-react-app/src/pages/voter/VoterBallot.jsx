/*
 * Flow:
 *   1. Voter selects candidates (local state)
 *   2. Click "Submit ballot" → openOtpFlow → OVS.verifyVoter → OTP modal
 *   3. Enter OTP → OVS.castVoteBallot({ electionId, tokenId, otp, selections }) → navigate /voter/submitted/:id
 *
 * Endpoints:
 *   OVS.getVoterElectionById({ id })          — GET /voter/election/ElectionById/{id}
 *   OVS.getVoterCandidates({ electionId })    — GET /voter/election/AllCandidate/{electionId}
 *   OVS.verifyMe({ electionId })             — POST /voter/verification/verifyMe
 *   OVS.castVoteBallot(payload)              — POST /voter/vote/cast
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, ConfirmModal, ErrorBanner } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { VoteToken } from "../../Service/GlobalState/voteTokenStore";
import { ReceiptStore } from "../../lib/receiptStore";

export default function VoterBallot() {
  const { id } = useParams();
  const nav = useNavigate();
  const me = useAppStore(s => s.me);

  const [el, setEl] = useState(null);
  const [cands, setCands] = useState([]);
  const [selections, setSelections] = useState({}); // { position: candidateId }
  const [loading, setLoading] = useState(true);
  const [otpState, setOtpState] = useState(null);   // { tokenId, devOtp } | null
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState(null);
  // True while the empty-ballot confirm modal is open.
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      withUnwrap(OVS.getVoterElectionById({ id })),
      withUnwrap(OVS.getVoterCandidates({ electionId: id })),
    ]).then(([e, c]) => { setEl(e); setCands(c || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const byPosition = useMemo(() => groupBy(cands, c => c.position), [cands]);
  const positions = Object.keys(byPosition);
  const completedCount = positions.filter(p => selections[p]).length;

  const toggle = (position, candidateId) => {
    setSelections(s => ({ ...s, [position]: s[position] === candidateId ? null : candidateId }));
  };

  // Wraps the OTP request — shared by the "submit ballot" button and the
  // "yes, submit empty ballot" path of the confirm modal. The backend
  // resolves the voter row from the JWT email, so we only pass the election.
  const requestOtp = async () => {
    try {
      const res = await withUnwrap(OVS.verifyMe({ electionId: id }));
      VoteToken.set({ tokenId: res.tokenId, expiryTime: res.expiryTime });
      setOtpState({ tokenId: res.tokenId, devOtp: res.devOtp /* dev only */ });
    } catch (e) {
      setErrMsg(e?.message || "Could not issue verification code");
    }
  };

  const startSubmit = () => {
    const isEmpty = Object.values(selections).filter(Boolean).length === 0;
    if (isEmpty) {
      setEmptyConfirm(true);
      return;
    }
    requestOtp();
  };

  const submitOtp = async (otp) => {
    setSubmitting(true); setErrMsg(null);
    try {
      // Backend's VoteRequest expects:
      //   { electionId, tokenId, votes: [{ position, candidateId }], requestId? }
      // The OTP and the tokenId are the same string in dev (ovs.dev.return-otp=true);
      // in prod the OTP lookup would resolve to a tokenId on the server. For now we
      // send what the user typed as the tokenId — the backend's token-consume step
      // is what makes the cast atomic.
      const votes = Object.entries(selections)
        .filter(([, candidateId]) => !!candidateId)
        .map(([position, candidateId]) => ({ position, candidateId }));

      const r = await withUnwrap(OVS.castVoteBallot({
        electionId: id,
        tokenId: otp || otpState.tokenId,
        votes,
      }));
      ReceiptStore.set({
        electionId: id,
        receiptToken: r.receiptToken || r.receiptHashToken,
        createdAt: r.createdAt || new Date().toISOString(),
      });
      VoteToken.clear();
      nav(`/voter/submitted/${id}`);
    } catch (e) {
      setErrMsg(e?.message || "Verification failed");
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell role="voter" active="/voter/elections"><Scaffold><div className="ink-3 text-sm">Loading…</div></Scaffold></AppShell>;
  if (!el)     return <AppShell role="voter" active="/voter/elections"><Topbar title="Not found" /><Scaffold><div className="ink-2">Election not available.</div></Scaffold></AppShell>;
  if (el.status !== "running") return <AppShell role="voter" active="/voter/elections"><Topbar title={el.name} /><Scaffold><div className="card p-10 text-center"><Icon name="lock" className="w-8 h-8 coral mx-auto mb-3" /><div className="display text-lg font-semibold">Voting is not open</div><div className="ink-2 text-sm mt-1">This election is {el.status}.</div></div></Scaffold></AppShell>;

  return (
    <AppShell role="voter" active="/voter/elections">
      <Topbar
        title={el.name}
        crumbs={[{ label: "Elections", path: "/voter/elections" }, { label: el.name, path: `/voter/election/${el.id}` }, { label: "Ballot" }]}
      />
      <div className="p-8 pb-32 max-w-3xl mx-auto">
        <div className="card p-5 mb-5 grad-soft">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 coral"><Icon name="user-x" className="w-5 h-5" /></div>
            <div className="text-sm">
              <div className="font-semibold mb-0.5">Your selections are anonymous</div>
              <div className="ink-2">Once submitted, the database separates your identity from your ballot. Not even an admin can link them.</div>
            </div>
          </div>
        </div>

        {/* Verification / cast errors that didn't open the OTP modal land here.
            Common cases: VOTER_NOT_FOUND (you're not on the roll), VOTER_NOT_ELIGIBLE
            (already voted / blocked), ELECTION_NOT_RUNNING. */}
        {errMsg && !otpState && (
          <div className="mb-5">
            <ErrorBanner
              message={`Could not start verification: ${errMsg}`}
              onClose={() => setErrMsg(null)}
            />
          </div>
        )}

        {positions.map((pos, idx) => {
          const list = byPosition[pos];
          const selected = selections[pos];
          return (
            <section key={pos} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg surface-2 flex items-center justify-center text-sm font-semibold">{idx+1}</div>
                <h2 className="display text-xl font-semibold">{pos}</h2>
                {selected
                  ? <span className="ml-auto chip pill-running"><Icon name="check" className="w-3 h-3" /> Selected</span>
                  : <span className="ml-auto text-xs ink-3">Pick one · or skip</span>}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {list.map(c => {
                  const chosen = selected === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(pos, c.id)}
                      className="card p-4 text-left card-hover"
                      style={chosen ? { borderColor: "var(--coral)", boxShadow: "0 0 0 2px rgba(232,93,117,0.15)" } : {}}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold shrink-0 ${chosen ? "grad-primary text-white" : "grad-soft coral"}`}>
                          {chosen ? <Icon name="check" className="w-5 h-5" /> : (c.firstName?.[0] || "") + (c.lastName?.[0] || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{c.firstName} {c.lastName}</div>
                            {c.ballotSerial && <span className="tag text-[10px]">{c.ballotSerial}</span>}
                          </div>
                          {c.manifesto && <div className="text-xs ink-2 mt-1 leading-relaxed">{c.manifesto}</div>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-64 right-0 surface border-t hairline p-4 flex items-center gap-4 z-20" style={{ backdropFilter: "blur(8px)" }}>
        <div className="flex-1 text-sm">
          <div className="font-medium">{completedCount} of {positions.length} positions selected</div>
          <div className="ink-3 text-xs mt-0.5">You can still skip positions — skipping counts as no vote (not abstain).</div>
        </div>
        <Btn variant="primary" onClick={startSubmit}><Icon name="send" className="w-4 h-4" /> Submit ballot</Btn>
      </div>

      {otpState && (
        <OtpModal
          email={me?.email}
          devOtp={otpState.devOtp}
          submitting={submitting}
          err={errMsg}
          onCancel={() => setOtpState(null)}
          onSubmit={submitOtp}
        />
      )}

      <ConfirmModal
        open={emptyConfirm}
        title="Submit an empty ballot?"
        message="You haven't selected any candidates. If you submit now, no preferences will be recorded — but your turnout will still be counted. Are you sure?"
        confirmLabel="Yes, submit empty"
        cancelLabel="Go back and choose"
        icon="alert-triangle"
        tone="navy"
        onCancel={() => setEmptyConfirm(false)}
        onConfirm={() => { setEmptyConfirm(false); requestOtp(); }}
      />
    </AppShell>
  );
}

function OtpModal({ email, devOtp, submitting, err, onCancel, onSubmit }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const inputs = useRef([]);

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g,"").slice(0,1);
    const next = [...digits]; next[i] = d; setDigits(next);
    if (d && i < 5) inputs.current[i+1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i-1]?.focus();
  };

  const submit = (e) => { e.preventDefault(); onSubmit(digits.join("")); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,31,46,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="card shadow-lift max-w-md w-full p-6 fade-in" style={{ borderRadius: 20 }}>
        <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center mb-4"><Icon name="mail-check" className="w-6 h-6" /></div>
        <div className="display text-xl font-semibold mb-1">Check your email</div>
        <p className="ink-2 text-sm mb-5">We sent a 6-digit code to <span className="mono font-medium ink">{email}</span>. It expires in 10 minutes.</p>
        {devOtp && (
          <div className="p-3 rounded-lg grad-soft text-xs flex items-start gap-2 mb-5">
            <Icon name="flask-conical" className="w-3.5 h-3.5 coral shrink-0 mt-0.5" />
            <span className="ink-2">Dev: your code is <span className="mono font-semibold ink">{devOtp}</span></span>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="flex gap-2 justify-center mb-4">
            {digits.map((d, i) => (
              <input
                key={i} ref={el => inputs.current[i] = el}
                value={d} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
                maxLength={1} inputMode="numeric" pattern="[0-9]" autoComplete="one-time-code"
                className="otp-digit"
              />
            ))}
          </div>
          {err && <div className="text-xs text-[var(--err)] text-center mb-3">{err}</div>}
          <button type="submit" disabled={submitting || digits.join("").length !== 6} className="btn btn-primary w-full justify-center">
            <Icon name="shield-check" className="w-4 h-4" /> {submitting ? "Submitting…" : "Verify and submit ballot"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-ghost w-full justify-center mt-2">Cancel</button>
        </form>
      </div>
    </div>
  );
}

function groupBy(arr, keyFn) {
  return (arr || []).reduce((acc, item) => { const k = keyFn(item); (acc[k] = acc[k] || []).push(item); return acc; }, {});
}
