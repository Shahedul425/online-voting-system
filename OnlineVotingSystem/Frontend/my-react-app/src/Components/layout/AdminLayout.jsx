// src/components/layout/AdminLayout.jsx
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard, ListChecks, PlusCircle, BarChart3, Play,
    Upload, Users, UserCheck, ShieldCheck, LogOut,
} from "lucide-react";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { AuthToken } from "../../Service/GlobalState/authToken";

const NAV = [
    {
        section: "Overview",
        items: [
            { label: "Dashboard",         icon: LayoutDashboard,  path: "/admin" },
        ],
    },
    {
        section: "Elections",
        items: [
            { label: "All Elections",      icon: ListChecks,       path: "/admin/elections/status?status=draft" },
            { label: "Workspace",          icon: ShieldCheck,      path: "/admin/elections/status?status=running", badge: { label: "2", color: "green" } },
            { label: "Create Election",    icon: PlusCircle,       path: "/admin/elections/create" },
            { label: "Results",            icon: BarChart3,        path: "/admin/elections/status?status=published", badge: { label: "Live", color: "purple" } },
        ],
    },
    {
        section: "Manage",
        items: [
            { label: "Upload Voters",      icon: Upload,           path: null }, // context-dependent
            { label: "Upload Candidates",  icon: Upload,           path: null },
            { label: "Voter List",         icon: Users,            path: null },
            { label: "Candidate List",     icon: UserCheck,        path: null },
            { label: "Audit Logs",         icon: ShieldCheck,      path: null },
        ],
    },
];

export default function AdminLayout({ children, breadcrumbs = [], topbarRight }) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const me        = useAppStore(s => s.me);
    const clearMe   = useAppStore(s => s.clearMe);
    const clearElection = useAppStore(s => s.clearElection);

    function logout() {
        AuthToken.clear();
        clearMe();
        clearElection();
        navigate("/signin", { replace: true });
    }

    function isActive(path) {
        if (!path) return false;
        const base = path.split("?")[0];
        return location.pathname === base;
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>

            {/* ── SIDEBAR ── */}
            <aside
                className="flex flex-col sticky top-0 h-screen overflow-y-auto"
                style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
            >
                {/* Brand */}
                <div
                    className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div
                        className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--purple), var(--pink))" }}
                    >
                        OV
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>OVS Admin</div>
                        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>
                            {me?.organizationId ? `Org · ${String(me.organizationId).slice(0, 8)}` : "Admin Console"}
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3">
                    {NAV.map(group => (
                        <div key={group.section}>
                            <div
                                className="px-5 pt-3 pb-1.5"
                                style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t3)" }}
                            >
                                {group.section}
                            </div>
                            {group.items.map(item => {
                                const active = isActive(item.path);
                                return (
                                    <div
                                        key={item.label}
                                        onClick={() => item.path && navigate(item.path)}
                                        className="flex items-center gap-2.5 px-5 py-2 transition-all"
                                        style={{
                                            fontSize: 12.5,
                                            fontWeight: active ? 700 : 500,
                                            color: active ? "var(--t1)" : "var(--t2)",
                                            background: active ? "var(--surface-2)" : "transparent",
                                            borderLeft: `2px solid ${active ? "var(--purple)" : "transparent"}`,
                                            cursor: item.path ? "pointer" : "default",
                                            opacity: item.path ? 1 : .45,
                                        }}
                                        onMouseEnter={e => { if (!active && item.path) { e.currentTarget.style.color = "var(--t1)"; e.currentTarget.style.background = "var(--surface-2)"; } }}
                                        onMouseLeave={e => { if (!active) { e.currentTarget.style.color = item.path ? "var(--t2)" : "var(--t3)"; e.currentTarget.style.background = "transparent"; } }}
                                    >
                    <span
                        className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                        style={{ background: active ? "var(--purple)" : "var(--t3)" }}
                    />
                                        {item.label}
                                        {item.badge && (
                                            <span
                                                className="ml-auto text-[9.5px] font-bold px-[7px] py-0.5 rounded-[10px] text-white"
                                                style={{ background: item.badge.color === "green" ? "var(--green)" : "var(--purple)" }}
                                            >
                        {item.badge.label}
                      </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div
                    className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--purple), var(--cyan))" }}
                    >
                        {me?.email?.[0]?.toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {me?.email ?? "Admin"}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 1, textTransform: "capitalize" }}>
                            {me?.role ?? "admin"}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 16, transition: "color .15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--t3)"}
                        title="Logout"
                    >
                        ↩
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="flex flex-col min-h-screen overflow-hidden">
                {/* Topbar */}
                <div
                    className="flex items-center justify-between px-6 flex-shrink-0"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", height: 54 }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: "var(--t3)", fontSize: 11 }}>/</span>}
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                                        color: i === breadcrumbs.length - 1 ? "var(--purple)" : "var(--t3)",
                                        cursor: crumb.path ? "pointer" : "default",
                                    }}
                                    onClick={() => crumb.path && navigate(crumb.path)}
                                >
                  {crumb.label}
                </span>
              </span>
                        ))}
                    </div>
                    {topbarRight && <div className="flex items-center gap-2 flex-shrink-0">{topbarRight}</div>}
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-[14px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
