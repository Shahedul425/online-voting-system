import { Link } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";

const FEATURES = [
  { icon: "shield-check", title: "Merkle-anchored ballots",        body: "Every vote is a leaf in a SHA-256 Merkle tree (depth 14). The root is published with the results and anyone can re-verify any ballot." },
  { icon: "user-x",       title: "Identity/ballot separation",    body: "Ballots live in a separate table with no voter_id column. The only link is the one-time token — consumed before the ballot is written." },
  { icon: "file-check-2", title: "Downloadable audit bundle",     body: "When an election publishes, a signed ZIP is produced: CSV roll hashes, candidate hashes, Merkle root, all audit rows." },
  { icon: "users",        title: "Bulk CSV onboarding",           body: "Spring Batch ingests voter rolls and candidate lists row-by-row with per-row validation, error reporting, and a single atomic commit." },
  { icon: "activity",     title: "Live turnout + forensic trace", body: "Admins see ballots land in real time. Every request carries a correlation ID that crosses Loki, Tempo, Prometheus, and the audit table." },
  { icon: "accessibility",title: "WCAG 2.1 AA baseline",           body: "Keyboard-complete flows, screen-reader-tested, 4.5:1 contrast minimums. Results announce changes via live regions." },
];

const STACK = [
  { layer: "Backend",         value: "Spring Boot 3 · Java 17" },
  { layer: "Auth",            value: "Keycloak · OAuth2/OIDC · PKCE" },
  { layer: "Database",        value: "PostgreSQL 16 · Flyway migrations" },
  { layer: "Batch",           value: "Spring Batch · Chunked CSV ingest" },
  { layer: "Crypto",          value: "SHA-256 Merkle tree · MerkelLevelModel" },
  { layer: "Observability",   value: "Loki · Tempo · Prometheus · Grafana · Alloy" },
  { layer: "Frontend",        value: "React 19 · Vite 7 · Tailwind v3 · Zustand 5" },
];

export default function Features() {
  return (
    <PublicShell>
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">Features</div>
        <h1 className="display text-4xl font-bold mb-3">Everything an election needs. Nothing it doesn't.</h1>
        <p className="text-lg ink-2 mb-10 max-w-2xl">
          TrustVote is deliberately small: identity, ballot, audit, verify. Each capability below
          maps to one Spring Boot controller and one PostgreSQL table.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-5">
              <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center mb-3">
                <Icon name={f.icon} className="w-5 h-5" />
              </div>
              <div className="font-semibold mb-1.5">{f.title}</div>
              <div className="text-xs ink-2 leading-relaxed">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl grad-navy text-white flex items-center justify-center">
              <Icon name="layers" className="w-5 h-5" />
            </div>
            <div>
              <div className="display text-xl font-semibold">Under the hood</div>
              <div className="text-xs ink-3">Production stack, same one used in the thesis</div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border hairline">
            <table className="w-full text-sm">
              <tbody>
                {STACK.map((s, i) => (
                  <tr key={s.layer} style={i % 2 === 0 ? { background: "var(--surface-2)" } : {}}>
                    <td className="p-3 w-40 ink-3 text-xs uppercase tracking-widest">{s.layer}</td>
                    <td className="p-3 mono">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 flex flex-wrap items-center gap-3">
        <Link to="/trust"        className="btn btn-ghost">Trust model <Icon name="arrow-right" className="w-4 h-4" /></Link>
        <Link to="/how-it-works" className="btn btn-ghost">How it works <Icon name="arrow-right" className="w-4 h-4" /></Link>
        <Link to="/signup"       className="btn btn-primary">Get started <Icon name="arrow-right" className="w-4 h-4" /></Link>
      </section>
    </PublicShell>
  );
}
