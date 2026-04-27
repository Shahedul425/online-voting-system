import { Link } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";

export default function Landing() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14">
        <div className="max-w-3xl">
          <div className="chip mb-5" style={{ background: "var(--surface-2)" }}>
            <Icon name="shield-check" className="w-3.5 h-3.5 coral" />
            <span className="ink-2">End-to-end verifiable • audited • Merkle-anchored</span>
          </div>
          <h1 className="display text-5xl md:text-6xl font-bold leading-tight mb-5">
            Elections people <span className="coral">actually trust</span> — because they can check them.
          </h1>
          <p className="text-lg ink-2 max-w-2xl mb-8">
            TrustVote separates identity from ballot at the database level, commits every vote to a
            Merkle tree, and lets any voter (or observer) verify a result against the published root —
            without surfacing who voted for whom.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/signup" className="btn btn-primary btn-lg">
              <Icon name="user-plus" className="w-4 h-4" /> Get started
              <Icon name="arrow-right" className="w-4 h-4" />
            </Link>
            <Link to="/how-it-works" className="btn btn-ghost btn-lg">
              <Icon name="play-circle" className="w-4 h-4" /> See how it works
            </Link>
            <Link
              to="/verify-receipt"
              className="text-sm ml-2 hover:opacity-80 inline-flex items-center gap-1"
              style={{ color: "var(--t2)" }}
            >
              Already voted? Verify a receipt <Icon name="arrow-right" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-5">
        <TeaserCard
          to="/how-it-works"
          icon="book-open"
          title="How it works"
          body="Five steps from org creation to published Merkle root. Every hand-off is audited."
        />
        <TeaserCard
          to="/features"
          icon="layers"
          title="Features"
          body="Bulk CSV onboarding, OTP-gated tokens, live turnout, publishable audit bundle."
        />
        <TeaserCard
          to="/trust"
          icon="shield"
          title="Trust model"
          body="Threat-by-threat: what we mitigate, what we partially mitigate, what's left to you."
        />
      </section>

      {/* Social proof band */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="card p-6 grad-soft">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div><div className="display text-3xl font-bold coral">512-bit</div><div className="text-xs ink-2 mt-1">SHA-256 Merkle tree, depth 14</div></div>
            <div><div className="display text-3xl font-bold coral">0 ms</div><div className="text-xs ink-2 mt-1">between vote and audit row</div></div>
            <div><div className="display text-3xl font-bold coral">100%</div><div className="text-xs ink-2 mt-1">of actions cross 4 data sources</div></div>
            <div><div className="display text-3xl font-bold coral">WCAG 2.1 AA</div><div className="text-xs ink-2 mt-1">keyboard, screen-reader, contrast</div></div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function TeaserCard({ to, icon, title, body }) {
  return (
    <Link to={to} className="card card-hover p-6 block">
      <div className="w-12 h-12 rounded-2xl grad-soft coral flex items-center justify-center mb-4">
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <div className="display text-xl font-semibold mb-2">{title}</div>
      <div className="text-sm ink-2 mb-4 leading-relaxed">{body}</div>
      <div className="flex items-center gap-1 text-sm coral font-semibold">
        Read more <Icon name="arrow-right" className="w-4 h-4" />
      </div>
    </Link>
  );
}
