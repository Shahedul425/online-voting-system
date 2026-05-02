import { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../Service/GlobalState/appStore";
import { AuthToken } from "../Service/GlobalState/authToken";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

/**
 * AppShell — left-rail nav + content area. Used by voter / admin / superadmin
 * pages.
 *
 *   ┌────────┬────────────────────────┐    Mobile (< md):
 *   │ Brand  │                        │    sidebar slides in over content
 *   │ Nav    │   <children>           │    behind a dim backdrop. A hamburger
 *   │ User   │                        │    button in the Topbar opens it.
 *   └────────┴────────────────────────┘    Desktop (≥ md): sidebar is fixed.
 *
 * Props:
 *   role: "voter" | "admin" | "superadmin"
 *   active: current route path (for highlight)
 *   children: page body
 */

// Context lets the Topbar's hamburger flip the sidebar open without prop-
// drilling — the children of <AppShell> include arbitrary pages and Topbars.
const SidebarCtx = createContext({ open: false, setOpen: () => {} });

export default function AppShell({ role, active, children }) {
  const me = useAppStore((s) => s.me);
  const clearMe = useAppStore((s) => s.clearMe);
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  // Auto-close the drawer whenever the route changes — otherwise after
  // tapping a nav link on mobile it would stay open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Esc key dismisses the mobile drawer (a tiny but expected affordance).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // When the drawer is open on mobile, lock body scroll so the page behind
  // the overlay doesn't scroll under the user's finger.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const groups = NAV[role] || [];

  const logout = () => {
    AuthToken.clear();
    clearMe();
    navigate("/");
  };

  return (
    <SidebarCtx.Provider value={{ open, setOpen }}>
      <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
        {/* Backdrop — visible on mobile when drawer is open */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 md:hidden"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
            }}
            aria-hidden="true"
          />
        )}

        <aside
          className={[
            "fixed left-0 top-0 bottom-0 w-64 flex flex-col z-40",
            "transition-transform duration-200 ease-out",
            // On desktop the sidebar is always pinned. On mobile we toggle
            // it with a class — using classes (not inline style) lets the
            // md: variant correctly win on desktop without specificity wars.
            open ? "translate-x-0" : "-translate-x-full",
            "md:translate-x-0",
          ].join(" ")}
          style={{
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            // On mobile, animate width-aware drop-shadow when open so the
            // overlay reads as a real drawer and not a floating panel.
            boxShadow: open ? "0 24px 60px rgba(0,0,0,0.45)" : "none",
          }}
        >
          {/* Brand row + close-on-mobile button */}
          <div
            className="flex items-center gap-2.5 px-5 py-5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Link
              to="/"
              className="flex items-center gap-2.5 flex-1 min-w-0"
              onClick={() => setOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl grad-primary text-white flex items-center justify-center flex-shrink-0">
                <Icon name="vote" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
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
            <button
              onClick={() => setOpen(false)}
              className="md:hidden p-1.5 rounded-md"
              style={{ color: "var(--t2)", background: "var(--surface-2)" }}
              aria-label="Close menu"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
            {groups.map((g) => (
              <div key={g.label} className="mb-4">
                <div
                  className="text-[10px] uppercase tracking-widest mb-1.5 px-2"
                  style={{ color: "var(--t3)", fontWeight: 700 }}
                >
                  {g.label}
                </div>
                {g.items.map((i) => {
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
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "var(--t1)";
                          e.currentTarget.style.background = "var(--surface-2)";
                        }
                      }}
                      onMouseLeave={(e) => {
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

        {/* Content column — no left margin on mobile, ml-64 on md+ */}
        <main className="flex-1 min-w-0 md:ml-64 w-full">{children}</main>
      </div>
    </SidebarCtx.Provider>
  );
}

/** Hamburger trigger — used inside Topbar. Hidden on md+ where sidebar is sticky. */
function SidebarToggle() {
  const { setOpen } = useContext(SidebarCtx);
  return (
    <button
      onClick={() => setOpen(true)}
      className="md:hidden p-2 rounded-lg flex-shrink-0"
      style={{
        color: "var(--t1)",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
      aria-label="Open menu"
    >
      <Icon name="menu" className="w-4 h-4" />
    </button>
  );
}

export function Topbar({ title, crumbs = [], right = null }) {
  return (
    <div
      className="sticky top-0 z-20 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center gap-3 sm:gap-4"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <SidebarToggle />
      <div className="flex-1 min-w-0">
        {crumbs.length > 0 && (
          <div
            className="hidden sm:flex items-center gap-1 text-xs mb-1"
            style={{ color: "var(--t3)" }}
          >
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {c.path ? (
                  <Link
                    to={c.path}
                    style={{ color: "var(--t2)" }}
                    className="hover:opacity-80"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span style={{ color: "var(--t2)" }}>{c.label}</span>
                )}
                {i < crumbs.length - 1 && (
                  <Icon name="chevron-right" className="w-3 h-3" />
                )}
              </span>
            ))}
          </div>
        )}
        <h1
          className="display text-lg sm:text-xl md:text-2xl font-semibold truncate"
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
  // Scale padding with viewport so phones don't waste their narrow widths.
  return <div className="p-4 sm:p-6 md:p-8">{children}</div>;
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
