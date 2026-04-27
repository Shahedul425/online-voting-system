import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../Service/GlobalState/appStore";
import { AuthToken } from "../Service/GlobalState/authToken";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

/**
 * AppShell — left-rail nav + content area. Used by voter / admin / superadmin pages.
 *
 * Layout:
 *   ┌────────┬────────────────────────┐
 *   │ Brand  │                        │
 *   │        │                        │
 *   │ Nav    │   <children>           │
 *   │ (top)  │                        │
 *   │        │                        │
 *   │ ─────  │                        │
 *   │ User   │                        │
 *   │ Sign-  │                        │
 *   │ out    │                        │
 *   └────────┴────────────────────────┘
 *
 * Props:
 *   role: "voter" | "admin" | "superadmin"
 *   active: current route path (for highlight)
 *   children: page body
 */
export default function AppShell({ role, active, children }) {
  const me = useAppStore(s => s.me);
  const clearMe = useAppStore(s => s.clearMe);
  const navigate = useNavigate();

  const groups = NAV[role] || [];

  const logout = () => { AuthToken.clear(); clearMe(); navigate("/"); };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <aside
        className="fixed left-0 top-0 bottom-0 w-64 flex flex-col"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="w-9 h-9 rounded-xl grad-primary text-white flex items-center justify-center flex-shrink-0">
            <Icon name="vote" className="w-5 h-5" />
          </div>
          <div>
            <div
              className="display font-semibold text-[15px] leading-none"
              style={{ color: "var(--t1)" }}
            >
              TrustVote
            </div>
            <div
              className="text-[10px] uppercase tracking-widest mt-1"
              style={{ color: "var(--t3)" }}
            >
              {role}
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
          {groups.map(g => (
            <div key={g.label} className="mb-4">
              <div
                className="text-[10px] uppercase tracking-widest mb-1.5 px-2"
                style={{ color: "var(--t3)", fontWeight: 700 }}
              >
                {g.label}
              </div>
              {g.items.map(i => {
                const isActive = active === i.path;
                return (
                  <Link
                    key={i.path}
                    to={i.path}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      color: isActive ? "var(--t1)" : "var(--t2)",
                      background: isActive ? "var(--surface-2)" : "transparent",
                      fontWeight: isActive ? 600 : 500,
                      borderLeft: `2px solid ${isActive ? "var(--purple)" : "transparent"}`,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--t1)";
                        e.currentTarget.style.background = "var(--surface-2)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--t2)";
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <Icon name={i.icon} className="w-4 h-4" />
                    {i.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer — account card anchored bottom-left */}
        <div
          className="px-4 py-4 space-y-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white flex-shrink-0"
              style={{ background: "var(--grad-primary)" }}
            >
              {(me?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: "var(--t1)" }}
                title={me?.email}
              >
                {me?.email || "guest"}
              </div>
              <div
                className="text-[10px] capitalize mt-0.5"
                style={{ color: "var(--t3)" }}
              >
                {me?.role || ""}
              </div>
            </div>
            <ThemeToggle size="sm" />
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost w-full justify-center"
            style={{ minHeight: 36 }}
          >
            <Icon name="log-out" className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-w-0">{children}</main>
    </div>
  );
}

export function Topbar({ title, crumbs = [], right = null }) {
  return (
    <div
      className="sticky top-0 z-10 px-8 py-5 flex items-center gap-4"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex-1 min-w-0">
        {crumbs.length > 0 && (
          <div
            className="flex items-center gap-1 text-xs mb-1"
            style={{ color: "var(--t3)" }}
          >
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {c.path
                  ? <Link to={c.path} style={{ color: "var(--t2)" }} className="hover:opacity-80">{c.label}</Link>
                  : <span style={{ color: "var(--t2)" }}>{c.label}</span>}
                {i < crumbs.length - 1 && <Icon name="chevron-right" className="w-3 h-3" />}
              </span>
            ))}
          </div>
        )}
        <h1
          className="display text-2xl font-semibold truncate"
          style={{ color: "var(--t1)" }}
        >
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}

export function Scaffold({ children }) {
  return <div className="p-8">{children}</div>;
}

const NAV = {
  voter: [
    {
      label: "You",
      items: [
        { path: "/voter/dashboard",     label: "Dashboard",     icon: "layout-dashboard" },
        { path: "/voter/elections",     label: "Elections",     icon: "vote" },
        { path: "/voter/notifications", label: "Notifications", icon: "bell" },
      ],
    },
    {
      label: "Public",
      items: [
        { path: "/verify-receipt", label: "Verify receipt", icon: "shield-check" },
      ],
    },
  ],
  admin: [
    {
      label: "Org",
      items: [
        { path: "/admin/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { path: "/admin/elections", label: "Elections", icon: "vote" },
        { path: "/admin/audit",     label: "Audit log", icon: "scroll-text" },
      ],
    },
  ],
  superadmin: [
    {
      label: "Platform",
      items: [
        { path: "/superadmin/dashboard", label: "Overview",      icon: "layout-dashboard" },
        { path: "/superadmin/orgs",      label: "Organizations", icon: "building-2" },
        { path: "/superadmin/admins",    label: "Org admins",    icon: "user-cog" },
        { path: "/superadmin/health",    label: "Observability", icon: "activity" },
      ],
    },
  ],
};
