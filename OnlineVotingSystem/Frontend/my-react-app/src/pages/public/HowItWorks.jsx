import { Link } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";

const STEPS = [
  {
    n: "01",
    icon: "building-2",
    title: "Org is created",
    body:
      "A superadmin registers the organisation, locks in its allowed sign-up domains, and assigns the org admin. Every action from the very first keystroke is written to the audit log.",
    audit: "CREATE_ORGANIZATION · ASSIGN_ORG_ADMIN",
  },
  {
    n: "02",
    icon: "upload",
    title: "Roll + ballot uploaded",
    body:
      "Admin uploads voter roll and candidate list via CSV. Spring Batch ingests row-by-row with per-row validation and a single atomic commit — partial loads are impossible.",
    audit: "UPLOAD_VOTERS · UPLOAD_CANDIDATES",
  },
  {
    n: "03",
    icon: "mail-check",
    title: "Voter requests a token",
    body:
      "Voter is verified by email + OTP. A one-time token is issued and expires in 10 minutes. No token, no ballot — and the same token can never be used twice.",
    audit: "VERIFY_VOTER · ISSUE_TOKEN",
  },
  {
    n: "04",
    icon: "vote",
    title: "Ballot is cast atomically",
    body:
      "BEGIN → UPDATE token → INSERT anonymised vote → COMMIT. If any statement fails, the whole transaction rolls back. Identity and ballot are never in the same table.",
    audit: "VOTE_CAST",
  },
  {
    n: "05",
    icon: "trophy",
    title: "Results are published",
    body:
      "Admin closes the election and finalises the Merkle root. Results become public, with per-position winners and a downloadable audit bundle anyone can verify.",
    audit: "CLOSE_ELECTION · PUBLISH_ELECTION",
  },
];

export default function HowItWorks() {
  return (
    <PublicShell>
      <section className="max-w-4xl mx-auto px-6 pt-14 pb-8">
        <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">How it works</div>
        <h1 className="display text-4xl font-bold mb-3">Five steps, every one audited.</h1>
        <p className="text-lg ink-2 mb-10 max-w-2xl">
          From organisation creation to the published Merkle root, each hand-off is recorded in
          the audit log with a correlation ID that ties business events, HTTP logs, traces, and
          metrics together.
        </p>

        <ol className="space-y-4">
          {STEPS.map(s => (
            <li key={s.n} className="card p-5 flex gap-5 items-start">
              <div className="shrink-0 w-12">
                <div className="display text-3xl font-bold coral leading-none">{s.n}</div>
              </div>
              <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center shrink-0">
                <Icon name={s.icon} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="display text-xl font-semibold mb-1">{s.title}</div>
                <div className="ink-2 text-sm leading-relaxed mb-2">{s.body}</div>
                <div
                  className="inline-flex items-center gap-1.5 text-[11px] mono px-2 py-0.5 rounded-md"
                  style={{
                    background: "rgba(232, 124, 102, 0.08)",
                    color: "var(--coral)",
                    border: "1px solid rgba(232, 124, 102, 0.18)",
                  }}
                >
                  <Icon name="scroll-text" className="w-3 h-3" /> {s.audit}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="card p-6 grad-navy text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Icon name="database" className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="display text-xl font-semibold mb-2">The atomic vote transaction</div>
              <p className="text-sm text-white/75 mb-4 max-w-xl">
                Every ballot goes through the same transaction. If anything fails the token stays
                unused and no vote is recorded — no half-cast ballots, no races.
              </p>
              <pre
                className="mono text-xs leading-relaxed p-4 rounded-xl overflow-auto"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
{`BEGIN;
  -- 1. Consume the one-time token (fails if already used or expired)
  UPDATE onetime_tokens
     SET consumed_at = now()
   WHERE id = :tokenId
     AND consumed_at IS NULL
     AND expires_at  > now();

  -- 2. Record the anonymised vote (no voter_id column)
  INSERT INTO ballots (id, election_id, position, candidate_id, cast_at, leaf_hash)
  VALUES (:ballotId, :electionId, :position, :candidateId, now(), :leafHash);

  -- 3. Append to audit log in the SAME transaction
  INSERT INTO audit_logs (id, action, entity_type, entity_id, request_id, created_at)
  VALUES (:auditId, 'VOTE_CAST', 'BALLOT', :ballotId, :requestId, now());
COMMIT;`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center mb-3">
              <Icon name="shield-check" className="w-5 h-5" />
            </div>
            <div className="display text-lg font-semibold mb-1">What we store</div>
            <ul className="text-sm ink-2 space-y-1.5 leading-relaxed">
              <li className="flex gap-2"><Icon name="check" className="w-4 h-4 coral shrink-0 mt-0.5" /> Voter rolls (email + voter ID), separate from ballots</li>
              <li className="flex gap-2"><Icon name="check" className="w-4 h-4 coral shrink-0 mt-0.5" /> Anonymised ballots (no voter_id column)</li>
              <li className="flex gap-2"><Icon name="check" className="w-4 h-4 coral shrink-0 mt-0.5" /> Per-row leaf hashes in a Merkle tree per election</li>
              <li className="flex gap-2"><Icon name="check" className="w-4 h-4 coral shrink-0 mt-0.5" /> Append-only audit log with request-IDs</li>
            </ul>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center mb-3">
              <Icon name="eye-off" className="w-5 h-5" />
            </div>
            <div className="display text-lg font-semibold mb-1">What we never store</div>
            <ul className="text-sm ink-2 space-y-1.5 leading-relaxed">
              <li className="flex gap-2"><Icon name="x" className="w-4 h-4 coral shrink-0 mt-0.5" /> A column linking voter → ballot — they live in different tables</li>
              <li className="flex gap-2"><Icon name="x" className="w-4 h-4 coral shrink-0 mt-0.5" /> Plain-text passwords (Keycloak handles credentials)</li>
              <li className="flex gap-2"><Icon name="x" className="w-4 h-4 coral shrink-0 mt-0.5" /> Tokens past their 10-minute window</li>
              <li className="flex gap-2"><Icon name="x" className="w-4 h-4 coral shrink-0 mt-0.5" /> Anything that would let us re-identify a vote after the fact</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="card p-6 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <div className="display text-lg font-semibold mb-0.5">Ready to see the rest?</div>
            <p className="text-sm ink-2">Dig into the feature surface, or read why we trust this design.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/features" className="btn btn-ghost">Features <Icon name="arrow-right" className="w-4 h-4" /></Link>
            <Link to="/trust"    className="btn btn-ghost">Trust model <Icon name="arrow-right" className="w-4 h-4" /></Link>
            <Link to="/signup"   className="btn btn-primary">Get started <Icon name="arrow-right" className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
