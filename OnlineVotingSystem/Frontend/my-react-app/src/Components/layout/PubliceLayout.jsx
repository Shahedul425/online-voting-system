// // src/Components/Admin/AdminPanel/AdminPanel.jsx
// import { useNavigate } from "react-router-dom";
// import {
//     PlusCircle, ListChecks, BarChart3, FileClock,
//     PlayCircle, PauseCircle, Lock, Archive, Users, ShieldCheck,
// } from "lucide-react";
// import AdminLayout from "../layout/AdminLayout";
// import { KpiCard, Panel, Btn, StatusPill, ShareBar, InfoRow } from "../ui";
//
// const STATUS_SHORTCUTS = [
//     { label: "Draft",     status: "draft",     icon: FileClock,    hint: "Upload lists & prepare" },
//     { label: "Running",   status: "running",   icon: PlayCircle,   hint: "Monitor activity" },
//     { label: "Stopped",   status: "stopped",   icon: PauseCircle,  hint: "Resume or close" },
//     { label: "Closed",    status: "closed",    icon: Lock,         hint: "Ready to publish" },
//     { label: "Published", status: "published", icon: Archive,      hint: "Archived & visible" },
// ];
//
// const RECENT = [
//     { name: "Student Council 2026", status: "running",   voters: 4821, turnout: 72, votes: 1847 },
//     { name: "Sports Rep Election",  status: "running",   voters: 1360, turnout: 45, votes: 612  },
//     { name: "Welfare Officer Vote", status: "closed",    voters: 2360, turnout: 89, votes: 2101 },
//     { name: "Arts Society Chair",   status: "draft",     voters: null, turnout: 0,  votes: null  },
//     { name: "Tech Society AGM",     status: "published", voters: 1607, turnout: 61, votes: 980  },
// ];
//
// export default function AdminPanel() {
//     const navigate = useNavigate();
//
//     return (
//         <AdminLayout
//             breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
//             topbarRight={
//                 <Btn variant="primary" onClick={() => navigate("/admin/elections/create")}>
//                     + New Election
//                 </Btn>
//             }
//         >
//             {/* KPI row */}
//             <div className="grid grid-cols-4 gap-3 animate-up">
//                 <KpiCard icon={ListChecks} accent="purple" value="12"   label="Total Elections"   badge="↑ 3 this month" />
//                 <KpiCard icon={PlayCircle} accent="cyan"   value="2"    label="Running Now"        badge="● Live" />
//                 <KpiCard icon={Users}      accent="green"  value="4,821" label="Total Voters"      badge="all elections" />
//                 <KpiCard icon={BarChart3}  accent="pink"   value="68.4%" label="Avg Turnout"       badge="↑ 5.2%" />
//             </div>
//
//             <div className="grid gap-3 animate-up-2" style={{ gridTemplateColumns: "1fr 290px" }}>
//                 {/* Elections table */}
//                 <Panel
//                     title="Recent Elections"
//                     action={
//                         <Btn variant="ghost" size="sm" onClick={() => navigate("/admin/elections/status?status=draft")}>
//                             View all →
//                         </Btn>
//                     }
//                     noPad
//                 >
//                     <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                         <thead>
//                         <tr>
//                             {["Election", "Status", "Turnout", "Votes"].map(h => (
//                                 <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
//                                     {h}
//                                 </th>
//                             ))}
//                         </tr>
//                         </thead>
//                         <tbody>
//                         {RECENT.map((e, i) => (
//                             <tr
//                                 key={e.name}
//                                 onClick={() => navigate("/admin/elections/status?status=" + e.status)}
//                                 style={{ borderBottom: i < RECENT.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", transition: "background .12s" }}
//                                 onMouseEnter={ev => ev.currentTarget.style.background = "rgba(255,255,255,.02)"}
//                                 onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
//                             >
//                                 <td style={{ padding: "12px 16px" }}>
//                                     <div style={{ fontWeight: 600, color: "var(--t1)", fontSize: 13 }}>{e.name}</div>
//                                     {e.voters && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{e.voters?.toLocaleString()} voters</div>}
//                                 </td>
//                                 <td style={{ padding: "12px 16px" }}><StatusPill status={e.status} /></td>
//                                 <td style={{ padding: "12px 16px" }}><ShareBar pct={e.turnout} winner={e.status === "running"} /></td>
//                                 <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", fontWeight: 700, color: e.votes ? "var(--t1)" : "var(--t3)", fontSize: 13 }}>
//                                     {e.votes?.toLocaleString() ?? "—"}
//                                 </td>
//                             </tr>
//                         ))}
//                         </tbody>
//                     </table>
//                 </Panel>
//
//                 {/* Right column */}
//                 <div className="flex flex-col gap-3">
//                     {/* Quick actions */}
//                     <Panel title="Quick Actions">
//                         <div className="flex flex-col gap-2">
//                             {[
//                                 { label: "⚡ Create Election",       path: "/admin/elections/create",            variant: "primary" },
//                                 { label: "↑ Upload Voters CSV",       path: "/admin/elections/status?status=draft", variant: "ghost"  },
//                                 { label: "↑ Upload Candidates CSV",   path: "/admin/elections/status?status=draft", variant: "ghost"  },
//                                 { label: "◈ View Results",            path: "/admin/elections/status?status=published", variant: "ghost" },
//                                 { label: "⊙ Audit Logs",              path: "/admin/elections/status?status=running",   variant: "ghost" },
//                             ].map(a => (
//                                 <Btn key={a.label} variant={a.variant} onClick={() => navigate(a.path)} className="w-full justify-center">
//                                     {a.label}
//                                 </Btn>
//                             ))}
//                         </div>
//                     </Panel>
//
//                     {/* System health */}
//                     <Panel title="System">
//                         <InfoRow label="Audit log"         value={<span style={{ color: "var(--green)", fontWeight: 600 }}>✓ Active</span>} />
//                         <InfoRow label="Running elections" value={<span style={{ color: "var(--cyan)",  fontWeight: 600 }}>2 live</span>} />
//                         <InfoRow label="Pending uploads"   value={<span style={{ color: "var(--orange)", fontWeight: 600 }}>⚠ 1 draft</span>} />
//                         <InfoRow label="Token expiry"      value={<span style={{ color: "var(--green)", fontWeight: 600 }}>✓ Normal</span>} last />
//                     </Panel>
//                 </div>
//             </div>
//
//             {/* Status shortcuts */}
//             <Panel title="Election Status Shortcuts" subtitle="Flow: pick a status → select election → manage workspace" className="animate-up-3">
//                 <div className="grid grid-cols-5 gap-3">
//                     {STATUS_SHORTCUTS.map(s => {
//                         const Icon = s.icon;
//                         return (
//                             <button
//                                 key={s.status}
//                                 onClick={() => navigate(`/admin/elections/status?status=${s.status}`)}
//                                 className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all"
//                                 style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
//                                 onMouseEnter={ev => { ev.currentTarget.style.borderColor = "var(--purple-b)"; ev.currentTarget.style.background = "var(--purple-d)"; }}
//                                 onMouseLeave={ev => { ev.currentTarget.style.borderColor = "var(--border)";   ev.currentTarget.style.background = "var(--surface-2)"; }}
//                             >
//                                 <Icon size={18} style={{ color: "var(--t2)" }} />
//                                 <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{s.label}</span>
//                                 <span style={{ fontSize: 10.5, color: "var(--t3)" }}>{s.hint}</span>
//                             </button>
//                         );
//                     })}
//                 </div>
//             </Panel>
//         </AdminLayout>
//     );
// }
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { AuthToken } from "../../Service/GlobalState/authToken";
import { Chip, Btn } from "../ui";

export function PublicNavbar({ showAuth = true }) {
    const navigate = useNavigate();
    const me       = useAppStore(s => s.me);
    const clearMe  = useAppStore(s => s.clearMe);

    function logout() {
        AuthToken.clear();
        clearMe();
        navigate("/signin", { replace: true });
    }

    return (
        <nav
            className="flex items-center justify-between px-6 flex-shrink-0"
            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", height: 56 }}
        >
            {/* Brand */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
                <div
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--purple), var(--pink))" }}
                >
                    OV
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>OVS</span>
            </div>

            {/* Right */}
            {showAuth && (
                <div className="flex items-center gap-2">
                    {me ? (
                        <>
                            <Chip variant="green" dot>{me.email}</Chip>
                            <Btn variant="ghost" size="sm" onClick={logout}>↩ Logout</Btn>
                        </>
                    ) : (
                        <>
                            <Btn variant="ghost" size="sm" onClick={() => navigate("/verify/receipt")}>🔍 Verify Receipt</Btn>
                            <Btn variant="primary" size="sm" onClick={() => navigate("/signin")}>Sign In →</Btn>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

// Voter pages have navbar + centered content column
export function VoterShell({ children, wide = false }) {
    return (
        <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
            <PublicNavbar />
            <main
                className="flex-1 py-8 px-6 mx-auto w-full flex flex-col gap-4"
                style={{ maxWidth: wide ? 960 : 720 }}
            >
                {children}
            </main>
        </div>
    );
}

// Full-screen center (auth pages)
export function AuthShell({ children }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
            <PublicNavbar showAuth={false} />
            <div className="flex-1 flex items-center justify-center px-4 py-10">
                {children}
            </div>
        </div>
    );
}

// Auth card wrapper
export function AuthCard({ children, wide = false }) {
    return (
        <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
                maxWidth: wide ? 460 : 420,
                background: "var(--surface)",
                border: "1px solid var(--border)",
            }}
        >
            {children}
        </div>
    );
}

export function AuthCardHeader({ title, subtitle }) {
    return (
        <div className="px-7 pt-7 pb-0">
            {/* mini brand */}
            <div className="flex items-center gap-2.5 mb-6">
                <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--purple), var(--pink))" }}
                >
                    OV
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>OVS</div>
                    <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>Secure Online Voting System</div>
                </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>{subtitle}</div>}
        </div>
    );
}

export function AuthCardBody({ children }) {
    return <div className="px-7 py-6">{children}</div>;
}

export function AuthCardFooter({ children }) {
    return (
        <div
            className="px-7 py-3.5"
            style={{ borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--t3)" }}
        >
            {children}
        </div>
    );
}
