import { Link, useLocation } from "react-router-dom";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

export function PublicHeader() {
  const { pathname } = useLocation();
  const nav = [
    { to: "/how-it-works",   label: "How it works" },
    { to: "/features",       label: "Features" },
    { to: "/trust",          label: "Trust" },
    { to: "/demo",           label: "Try it",         badge: "Live" },
    { to: "/verify-receipt", label: "Verify receipt" },
  ];
  return (
    <header className="sticky top-0 z-10 surface border-b hairline" style={{ backdropFilter: "blur(8px)" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg grad-primary text-white flex items-center justify-center">
            <Icon name="vote" className="w-5 h-5" />
          </div>
          <div className="display font-semibold">TrustVote</div>
        </Link>
        <nav className="hidden md:flex items-center gap-1 ml-6 flex-1">
          {nav.map(n => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5"
                style={active ? { background: "var(--surface-2)", fontWeight: 600 } : { color: "var(--ink-2)" }}
              >
                {n.label}
                {n.badge && (
                  <span
                    className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(232,124,102,0.14)", color: "var(--coral)" }}
                  >
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <Link to="/signin" className="btn btn-ghost">Sign in</Link>
          <Link to="/signup" className="btn btn-primary">
            <Icon name="user-plus" className="w-4 h-4" /> Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t hairline">
      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="display font-semibold mb-1">TrustVote</div>
          <div className="ink-2">Trustworthy online elections for organisations — 2026.</div>
        </div>
        <div>
          <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">Learn</div>
          <ul className="space-y-1">
            <li><Link to="/how-it-works" className="hover:coral">How it works</Link></li>
            <li><Link to="/features"     className="hover:coral">Features</Link></li>
            <li><Link to="/trust"        className="hover:coral">Trust model</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] ink-3 uppercase tracking-widest mb-2">Voter</div>
          <ul className="space-y-1">
            <li><Link to="/verify-receipt" className="hover:coral">Verify a receipt</Link></li>
            <li><Link to="/signin"          className="hover:coral">Sign in</Link></li>
            <li><Link to="/demo"            className="hover:coral">Try the demo</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
