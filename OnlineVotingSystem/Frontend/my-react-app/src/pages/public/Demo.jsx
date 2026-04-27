/*
 * Demo / Try-it page — designed for tutors and recruiters who land on the
 * site without context. It lays out:
 *
 *   1. A one-line "what this is" hero
 *   2. A 5-minute walkthrough they can follow start-to-finish
 *   3. Demo credentials per role with click-to-copy
 *   4. A small "what you'll see along the way" feature strip
 *   5. Links to the public verify page, the source repo, and the runbook
 *
 * Everything renders from static data — no API calls — so a cold visit
 * doesn't depend on the backend being warm. Once they sign in via the
 * cards they're into the live app like any other user.
 */
import { Link } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { CopyButton } from "../../ui/Primitives";

// EDIT-ME: keep these synced with whatever you actually seeded into Keycloak.
const ACCOUNTS = [
  {
    role: "Super admin",
    color: "navy",
    icon: "shield",
    blurb:
      "Platform owner. Registers tenant organisations, assigns the first admin to each, and watches the platform health dashboard.",
    email: "islamshahedul537@gmail.com",
    password: "12345678",
    landing: "/superadmin/dashboard",
    things: [
      "Register a new tenant org → Organizations → New",
      "Assign an org admin by email → Org admins",
      "Open Platform health → embedded Grafana with logs, traces, metrics",
    ],
  },
  {
    role: "Org admin",
    color: "coral",
    icon: "user-cog",
    blurb:
      "Runs elections inside one organisation. Uploads voter rolls + candidates, opens / closes / publishes elections, reviews the audit log.",
    email: "example123@lsbu.ac.uk",
    password: "12345678",
    landing: "/admin/dashboard",
    things: [
      "Create a draft election → Elections → New election",
      "Upload voter list & candidate list (CSV samples in /samples)",
      "Start → Close → Publish, watch the audit log scroll on each step",
    ],
  },
  {
    role: "Voter",
    color: "primary",
    icon: "user",
    blurb:
      "End-user with one ballot per running election they're enrolled in. Gets an emailed OTP, casts a vote, gets a Merkle receipt.",
    email: "abid11@lsbu.ac.uk",
    password: "12345678",
    landing: "/voter/dashboard",
    things: [
      "Open a running election → Cast my ballot",
      "Receive a 6-digit OTP by email (check inbox)",
      "After cast: emailed receipt → paste into /verify-receipt",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Sign in as the org admin",
    body:
      "Use the admin credentials below. You land on the org dashboard with KPIs for running / drafts / closed / published elections.",
    icon: "log-in",
  },
  {
    n: "02",
    title: "Run an election end-to-end",
    body:
      "Pick the seeded election, upload voters + candidates if needed, then click Start → Close → Publish. Each transition writes an audit row you can see live.",
    icon: "play",
  },
  {
    n: "03",
    title: "Switch to a voter and vote",
    body:
      "Sign out, sign in as a voter on the eligible roll. Submit a ballot — an OTP arrives by email, you enter it, you get a receipt token back.",
    icon: "vote",
  },
  {
    n: "04",
    title: "Verify your ballot publicly",
    body:
      "Sign out entirely. Open Verify receipt, paste the token. The Merkle proof renders and the leaf hash matches the published root.",
    icon: "shield-check",
  },
  {
    n: "05",
    title: "Inspect the trail",
    body:
      "Sign back in as the super admin and open Platform health. Every action above (login, upload, vote, publish) is in Loki / Tempo / Prometheus with the same request-id.",
    icon: "activity",
  },
];

const FEATURES = [
  { icon: "lock",         title: "Anonymous ballots",       body: "Voter ↔ ballot live in different tables. Re-identification is structurally impossible." },
  { icon: "git-branch",   title: "Atomic commit",           body: "Token consume + ballot insert + audit row in one DB transaction. No half-cast votes." },
  { icon: "shield-check", title: "Merkle proof per ballot", body: "Every receipt hashes into a per-election Merkle tree. Public verify endpoint anyone can hit." },
  { icon: "scroll-text",  title: "Append-only audit log",   body: "Every administrative + ballot action gets a row, an actor, a status, and the request-id." },
  { icon: "mail-check",   title: "Real OTP delivery",       body: "Spring Boot → SMTP (Gmail in demo). 6-digit code, 10-minute expiry, single-use." },
  { icon: "bar-chart-3",  title: "Three-pillar observability", body: "Spring Actuator + Loki + Tempo + Prometheus, surfaced inside the app on Platform health." },
];

const STACK = [
  { layer: "Frontend",        items: ["React 18", "Vite", "react-router", "Tailwind", "Lucide", "Recharts"] },
  { layer: "Backend",         items: ["Spring Boot 3.5", "Java 21", "Spring Security (JWT)", "Spring Data JPA", "Spring Batch"] },
  { layer: "Auth",            items: ["Keycloak 24"] },
  { layer: "Data",            items: ["PostgreSQL", "Hibernate", "Merkle leaf indexing"] },
  { layer: "Observability",   items: ["Prometheus", "Loki", "Tempo", "Grafana", "Alloy"] },
  { layer: "Infra",           items: ["Docker Compose", "GitHub Actions (planned)", "DigitalOcean (planned)"] },
];

export default function Demo() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-14 pb-8">
        <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">Try the live demo</div>
        <h1 className="display text-4xl font-bold mb-3">
          Five minutes from sign-in to verified ballot.
        </h1>
        <p className="text-lg ink-2 mb-6 max-w-2xl">
          Pick a role below, follow the five-step walkthrough, and you&apos;ll have run an
          election end-to-end — including a publicly verifiable Merkle proof — by the time
          you&apos;re done. The accounts below are sandbox-only on a demo Keycloak realm;
          no real personal data is involved.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/signin" className="btn btn-primary">
            <Icon name="log-in" className="w-4 h-4" /> Sign in to the demo
          </Link>
          <Link to="/how-it-works" className="btn btn-ghost">
            <Icon name="book-open" className="w-4 h-4" /> Read how it works
          </Link>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            <Icon name="github" className="w-4 h-4" /> Source on GitHub
          </a>
        </div>
      </section>

      {/* Demo accounts */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="display text-2xl font-bold">Demo accounts</h2>
          <span className="text-[11px] ink-3">Click the value to copy</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {ACCOUNTS.map(a => <AccountCard key={a.email} a={a} />)}
        </div>
        <div
          className="text-[11px] ink-3 mt-3 inline-flex items-center gap-1"
        >
          <Icon name="info" className="w-3.5 h-3.5" />
          These are sandbox accounts on a demo Keycloak realm — no real personal data is involved.
        </div>
      </section>

      {/* Walkthrough */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="display text-2xl font-bold mb-4">Five-step walkthrough</h2>
        <ol className="space-y-3">
          {STEPS.map(s => (
            <li key={s.n} className="card p-5 flex gap-4 items-start">
              <div className="display text-2xl font-bold coral leading-none w-10 shrink-0">{s.n}</div>
              <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center shrink-0">
                <Icon name={s.icon} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="display text-lg font-semibold mb-0.5">{s.title}</div>
                <p className="text-sm ink-2 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Features strip */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="display text-2xl font-bold mb-4">What you&apos;ll see along the way</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-4">
              <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center mb-3">
                <Icon name={f.icon} className="w-5 h-5" />
              </div>
              <div className="font-semibold mb-1" style={{ color: "var(--t1)" }}>{f.title}</div>
              <div className="text-xs ink-2 leading-relaxed">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stack table */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="display text-2xl font-bold mb-4">Tech stack</h2>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="surface-2 text-xs ink-3 uppercase tracking-widest">
                <th className="px-4 py-2.5 text-left w-44">Layer</th>
                <th className="px-4 py-2.5 text-left">Built with</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map(row => (
                <tr key={row.layer} className="border-t hairline">
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "var(--t1)" }}>{row.layer}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {row.items.map(t => (
                        <span
                          key={t}
                          className="text-[11px] mono px-2 py-0.5 rounded-md"
                          style={{
                            background: "rgba(232,124,102,0.08)",
                            color: "var(--coral)",
                            border: "1px solid rgba(232,124,102,0.18)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="card p-6 grad-navy text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Icon name="rocket" className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="display text-xl font-semibold mb-2">Ready to dive in?</div>
              <p className="text-sm text-white/75 mb-4 max-w-xl">
                Sign in with the credentials above, or skip straight to the public proof checker —
                paste any receipt token from a published election and you&apos;ll see the Merkle path
                rendered against the canonical root.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/signin"
                  className="btn"
                  style={{ background: "white", color: "var(--navy)", fontWeight: 600 }}
                >
                  <Icon name="log-in" className="w-4 h-4" /> Sign in
                </Link>
                <Link to="/verify-receipt" className="btn" style={{ borderColor: "rgba(255,255,255,0.4)", color: "white" }}>
                  <Icon name="shield-check" className="w-4 h-4" /> Verify a receipt
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function AccountCard({ a }) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={
            a.color === "navy"
              ? { background: "var(--grad-navy)", color: "white" }
              : a.color === "primary"
                ? { background: "var(--grad-primary)", color: "white" }
                : { background: "var(--grad-soft)", color: "var(--coral)" }
          }
        >
          <Icon name={a.icon} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold" style={{ color: "var(--t1)" }}>{a.role}</div>
          <div className="text-[11px] ink-3">Lands on {a.landing}</div>
        </div>
      </div>
      <p className="text-xs ink-2 leading-relaxed mb-3">{a.blurb}</p>

      <div className="space-y-2 mb-3">
        <CredRow label="Email"    value={a.email} />
        <CredRow label="Password" value={a.password} mono />
      </div>

      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">Try this</div>
      <ul className="space-y-1 text-[11px] ink-2 mb-4">
        {a.things.map((t, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <Icon name="check" className="w-3 h-3 coral mt-0.5 shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/signin"
        className="btn btn-ghost mt-auto w-full justify-center"
        state={{ prefillEmail: a.email }}
      >
        <Icon name="log-in" className="w-4 h-4" /> Sign in as {a.role.toLowerCase()}
      </Link>
    </div>
  );
}

function CredRow({ label, value, mono }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
    >
      <span
        className="text-[10px] ink-3 uppercase tracking-widest shrink-0"
        style={{ width: "70px" }}
      >
        {label}
      </span>
      <span
        className={`flex-1 min-w-0 truncate text-xs ${mono ? "mono" : ""}`}
        style={{ color: "var(--t1)" }}
        title={value}
      >
        {value}
      </span>
      <CopyButton
        text={value}
        className="text-[10px] ink-3 hover:coral inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md"
      >
        <Icon name="copy" className="w-3.5 h-3.5" />
      </CopyButton>
    </div>
  );
}
