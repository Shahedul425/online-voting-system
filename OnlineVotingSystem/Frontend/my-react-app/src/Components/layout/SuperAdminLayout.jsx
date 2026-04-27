// src/pages/superadmin/SuperAdminLayout.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../../Service/GlobalState/appStore.js";
import { AuthToken } from "../../Service/GlobalState/authToken.js";

const NAV = [
    { section: "Platform",      items: [{ label: "Console",       path: "/superAdmin" }] },
    { section: "Organizations", items: [
            { label: "Create Org",    path: "/superadmin/orgs/create" },
            { label: "Assign Admin",  path: "/superadmin/orgs/assign-admin" },
            { label: "Org Overview",  path: "/superadmin/orgs" },
        ]},
    { section: "Coming Soon", items: [
            { label: "Global Audit",      path: null, disabled: true },
            { label: "System Health",     path: null, disabled: true },
            { label: "Analytics",         path: null, disabled: true },
        ]},
];

export default function SuperAdminLayout({ children, breadcrumbs = [], topbarRight }) {
    const navigate = useNavigate();
    const location = useLocation();
    const clearMe  = useAppStore(s => s.clearMe);

    function logout() { AuthToken.clear(); clearMe(); navigate("/signin", { replace: true }); }
    function isActive(path) { return path && location.pathname === path; }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: "100vh" }}>
            {/* Sidebar */}
            <aside className="flex flex-col sticky top-0 h-screen overflow-y-auto"
                   style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0"
                     style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                         style={{ background: "linear-gradient(135deg, var(--cyan), var(--purple))" }}>
                        SA
                    </div>
                    <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t1)" }}>OVS Platform</div>
                        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>Super Admin</div>
                    </div>
                </div>

                <nav className="flex-1 py-3">
                    {NAV.map(group => (
                        <div key={group.section}>
                            <div className="px-5 pt-3 pb-1.5"
                                 style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t3)" }}>
                                {group.section}
                            </div>
                            {group.items.map(item => {
                                const active = isActive(item.path);
                                return (
                                    <div key={item.label}
                                         onClick={() => !item.disabled && item.path && navigate(item.path)}
                                         className="flex items-center gap-2.5 px-5 py-2 transition-all"
                                         style={{
                                             fontSize: 12.5, fontWeight: active ? 600 : 500,
                                             color: active ? "var(--cyan)" : item.disabled ? "var(--t3)" : "var(--t2)",
                                             background: active ? "var(--cyan-d)" : "transparent",
                                             borderLeft: `2px solid ${active ? "var(--cyan)" : "transparent"}`,
                                             cursor: item.disabled ? "not-allowed" : item.path ? "pointer" : "default",
                                             opacity: item.disabled ? .4 : 1,
                                         }}>
                    <span className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                          style={{ background: active ? "var(--cyan)" : "var(--t3)" }} />
                                        {item.label}
                                        {item.disabled && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--orange)" }}>Soon</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0"
                     style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                         style={{ background: "linear-gradient(135deg, var(--cyan), var(--purple))" }}>SA</div>
                    <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>Super Admin</div>
                        <div style={{ fontSize: 10.5, color: "var(--t3)" }}>system@ovs.io</div>
                    </div>
                    <button onClick={logout}
                            style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 16 }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--t3)"}>↩</button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex flex-col">
                <div className="flex items-center justify-between px-6 flex-shrink-0"
                     style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", height: 54 }}>
                    <div className="flex items-center gap-2">
                        {breadcrumbs.map((c, i) => (
                            <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: "var(--t3)", fontSize: 11 }}>/</span>}
                                <span style={{ fontSize: 11.5, fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                                    color: i === breadcrumbs.length - 1 ? "var(--cyan)" : "var(--t3)",
                                    cursor: c.path ? "pointer" : "default" }}
                                      onClick={() => c.path && navigate(c.path)}>
                  {c.label}
                </span>
              </span>
                        ))}
                    </div>
                    {topbarRight}
                </div>
                <main className="flex-1 p-6 flex flex-col gap-[14px] overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
