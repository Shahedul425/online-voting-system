import { Link } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";

const THREATS = [
  { status: "mitigated",  title: "Ballot stuffing",          body: "One-time tokens, consumed in the same transaction as the vote. A token can't fire twice.", ctl: "onetime_tokens.consumed_at UNIQUE" },
  { status: "mitigated",  title: "Identity ↔ ballot linking", body: "Ballots table has no voter_id column. The link lives only on the (consumed) token row.",     ctl: "no FK on ballots.voter_id" },
  { status: "mitigated",  title: "Server-side tampering",     body: "Merkle root computed after close and published. Any tampering changes the leaf hash and invalidates the proof.", ctl: "SHA-256 Merkle tree" },
  { status: "mitigated",  title: "Admin-side after-the-fact edit", body: "Audit log is append-only; insert rows include requestId that crosses Loki/Tempo/Prometheus.", ctl: "audit_logs table + reviewer pipeline" },
  { status: "mitigated",  title: "OTP brute force",           body: "Rate-limited per-voter, 10-minute expiry, single-use.", ctl: "otp_issued + Spring rate limiter" },
  { status: "partial",    title: "Voter device compromise",   body: "If the voter's laptop is owned, the attacker can cast on their behalf before they do. Out of scope; mitigated only by device hygiene and 2FA.", ctl: "email OTP raises the bar but doesn't eliminate" },
  { status: "partial",    title: "Coercion / vote-buying",    body: "Receipt proves a ballot was cast but intentionally doesn't reveal the selection. Coercer can prove voting happened but not what.", ctl: "receipt hides selection" },
  { status: "operational",title: "Correct voter roll",        body: "Whoever uploads the roll determines who can vote. That's the org admin's responsibility — we audit the upload, not the list's correctness.", ctl: "import audit row + per-row validation" },
  { status: "operational",title: "Correct candidate list",    body: "Same as above. Admin uploads; TrustVote audits the upload event and the bytes.", ctl: "candidate upload audit row" },
];

const STYLE = {
  mitigated:   { bg: "rgba(47,158,117,0.12)", fg: "var(--ok)",    icon: "shield-check",  label: "Mitigated" },
  partial:     { bg: "rgba(217,138,43,0.12)", fg: "var(--warn)",  icon: "alert-triangle",label: "Partial" },
  operational: { bg: "rgba(59,126,161,0.12)", fg: "var(--info)",  icon: "info",          label: "Operational" },
};

export default function Trust() {
  const counts = THREATS.reduce((a, t) => (a[t.status] = (a[t.status]||0)+1, a), {});
  return (
    <PublicShell>
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">Trust model</div>
        <h1 className="display text-4xl font-bold mb-3">What we guard against — and what we don't.</h1>
        <p className="text-lg ink-2 mb-10 max-w-2xl">
          Security is a layered problem. Here's every threat we considered, sorted by how much
          TrustVote can do about it. If a row says <span className="font-semibold">Operational</span>,
          the mitigation lives with your organisation, not with us.
        </p>

        {/* summary tiles */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {["mitigated","partial","operational"].map(s => {
            const st = STYLE[s];
            return (
              <div key={s} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: st.bg, color: st.fg }}>
                    <Icon name={st.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{st.label}</div>
                    <div className="text-xs ink-3">{counts[s] || 0} threat{(counts[s]||0)!==1?"s":""}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {THREATS.map(t => {
            const st = STYLE[t.status];
            return (
              <div key={t.title} className="card p-5">
                <span className="chip mb-3 inline-flex" style={{ background: st.bg, color: st.fg }}>
                  <Icon name={st.icon} className="w-3 h-3" />{st.label}
                </span>
                <div className="font-semibold mb-1">{t.title}</div>
                <div className="text-xs ink-2 mb-3 leading-relaxed">{t.body}</div>
                <div className="mono text-[10px] ink-3 pt-2 border-t hairline">{t.ctl}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="card p-6 grad-soft">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/80 coral flex items-center justify-center shrink-0">
              <Icon name="alert-circle" className="w-6 h-6" />
            </div>
            <div>
              <div className="display text-xl font-semibold mb-2">Explicit non-goals</div>
              <ul className="space-y-1.5 ink-2 text-sm">
                <li>• TrustVote does not attempt to prevent device-level compromise of the voter's machine.</li>
                <li>• TrustVote does not eliminate coercion — it only prevents a coercer from seeing the selection.</li>
                <li>• TrustVote does not verify the correctness of the uploaded voter roll or candidate list.</li>
                <li>• TrustVote is not cryptographically post-quantum — SHA-256 is considered secure against classical adversaries.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 flex flex-wrap items-center gap-3">
        <Link to="/features"    className="btn btn-ghost">Features <Icon name="arrow-right" className="w-4 h-4" /></Link>
        <Link to="/how-it-works" className="btn btn-ghost">How it works <Icon name="arrow-right" className="w-4 h-4" /></Link>
        <Link to="/verify-receipt" className="btn btn-primary">Verify a receipt <Icon name="arrow-right" className="w-4 h-4" /></Link>
      </section>
    </PublicShell>
  );
}
