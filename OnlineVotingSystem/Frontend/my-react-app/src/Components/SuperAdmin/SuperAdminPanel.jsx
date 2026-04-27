// import React from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Building2,
//     UserCog,
//     ShieldCheck,
//     Activity,
//     ScrollText,
//     BarChart2,
// } from "lucide-react";
//
// function Card({ title, desc, icon: Icon, onClick, disabled }) {
//     return (
//         <button
//             type="button"
//             onClick={disabled ? undefined : onClick}
//             className={[
//                 "rounded-2xl border p-6 text-left transition w-full",
//                 disabled
//                     ? "border-white/10 bg-white/5 opacity-60 cursor-not-allowed"
//                     : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-400/40",
//             ].join(" ")}
//         >
//             <div className="flex items-center gap-3">
//                 <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
//                     <Icon className="h-5 w-5 text-indigo-300" />
//                 </div>
//                 <div>
//                     <div className="text-base font-semibold text-white/90">{title}</div>
//                     <div className="mt-1 text-sm text-white/60">{desc}</div>
//                 </div>
//             </div>
//
//             {disabled ? (
//                 <div className="mt-4 text-xs text-amber-300">Not wired yet (API coming soon)</div>
//             ) : (
//                 <div className="mt-4 text-xs text-white/50">Open →</div>
//             )}
//         </button>
//     );
// }
//
// export default function SuperAdminPanel() {
//     const navigate = useNavigate();
//
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
//             <div className="mx-auto w-full max-w-6xl">
//                 <div className="text-center">
//                     <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
//                         <ShieldCheck className="h-4 w-4 text-emerald-300" />
//                         <span className="text-sm text-white/80">OVM • Super Admin</span>
//                     </div>
//                     <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Platform Console</h1>
//                     <p className="mt-2 text-sm text-white/60">
//                         Organization management and platform oversight.
//                     </p>
//                 </div>
//
//                 <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
//                     <Card
//                         title="Organizations"
//                         desc="Create organizations and manage domains."
//                         icon={Building2}
//                         onClick={() => navigate("/superadmin/orgs/create")}
//                     />
//
//                     <Card
//                         title="Assign Org Admin"
//                         desc="Promote a user to org admin."
//                         icon={UserCog}
//                         onClick={() => navigate("/superadmin/orgs/assign-admin")}
//                     />
//
//                     {/* Below are “future” cards */}
//                     <Card
//                         title="Global Audit Logs"
//                         desc="Search all audits across the platform."
//                         icon={ScrollText}
//                         disabled
//                     />
//                     <Card
//                         title="System Health"
//                         desc="Batch jobs, imports, and background tasks."
//                         icon={Activity}
//                         disabled
//                     />
//                     <Card
//                         title="Platform Analytics"
//                         desc="Elections, turnout, and integrity metrics."
//                         icon={BarChart2}
//                         disabled
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// }
// src/pages/superadmin/SuperAdminPanel.jsx
// src/Components/SuperAdmin/SuperAdminPanel.jsx
import { useNavigate } from "react-router-dom";
import { Building2, ScrollText, Activity, BarChart2, FolderOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import SuperAdminLayout from "../layout/SuperAdminLayout";

function KpiCard({ icon, value, label, accent = "cyan" }) {
    const Icon = icon;

    const accents = {
        cyan:   { border: "rgba(77,217,232,.15)",  ico: "rgba(77,217,232,.12)",  color: "var(--cyan)",   glow: "#4dd9e8" },
        purple: { border: "rgba(124,111,247,.15)", ico: "rgba(124,111,247,.14)", color: "var(--purple)", glow: "#7c6ff7" },
        green:  { border: "rgba(77,202,136,.15)",  ico: "rgba(77,202,136,.12)",  color: "var(--green)",  glow: "#4dca88" },
    };
    const a = accents[accent];

    return (
        <div style={{ position: "relative", overflow: "hidden", background: "var(--surface)", border: `1px solid ${a.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ position: "absolute", top: -28, right: -18, width: 80, height: 80, borderRadius: "50%", background: a.glow, opacity: .08 }} />
            <div style={{ width: 38, height: 38, borderRadius: 10, background: a.ico, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={18} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: "var(--t1)" }}>{value}</div>
            <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 4 }}>{label}</div>
        </div>
    );
}

const ACTION_CARDS = [
    {
        title: "Organizations",
        desc:  "View all orgs, search, and assign admins directly from the table",
        icon:  FolderOpen,
        path:  "/superAdmin/orgs",
        color: "cyan",
        enabled: true,
    },
    {
        title: "Create Organization",
        desc:  "Add a new org with email domain mapping",
        icon:  Building2,
        path:  "/superadmin/orgs/create",
        color: "purple",
        enabled: true,
    },
    {
        title: "Global Audit Logs",
        desc:  "Search all audits across every organization",
        icon:  ScrollText,
        path:  null,
        color: "gray",
        enabled: false,
    },
    {
        title: "System Health",
        desc:  "Batch jobs, imports, and background tasks",
        icon:  Activity,
        path:  null,
        color: "gray",
        enabled: false,
    },
    {
        title: "Platform Analytics",
        desc:  "Elections, turnout, and integrity metrics",
        icon:  BarChart2,
        path:  null,
        color: "gray",
        enabled: false,
    },
];

const ACCENT_COLORS = {
    cyan:   { border: "rgba(77,217,232,.3)",  bg: "rgba(77,217,232,.12)",  color: "var(--cyan)",   hover: "rgba(77,217,232,.3)"  },
    purple: { border: "var(--purple-b)",       bg: "var(--purple-d)",        color: "var(--purple)", hover: "var(--purple-b)"       },
    gray:   { border: "var(--border)",         bg: "rgba(255,255,255,.04)", color: "var(--t3)",     hover: "var(--border)"         },
};

export default function SuperAdminPanel() {
    const navigate = useNavigate();
    const [orgCount, setOrgCount] = useState("…");

    useEffect(() => {
        withUnwrap(OVS.getAllOrganizations())
            .then(data => setOrgCount(Array.isArray(data) ? data.length : "—"))
            .catch(() => setOrgCount("—"));
    }, []);

    return (
        <SuperAdminLayout
            breadcrumbs={[{ label: "SuperAdmin" }, { label: "Console" }]}
            topbarRight={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "var(--cyan-d)", color: "var(--cyan)", border: "1px solid rgba(77,217,232,.2)" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }} />
          Super Admin
        </span>
            }
        >
            {/* Header */}
            <div style={{ animation: "fadeUp .28s both" }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>Platform Console</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>Organization management and platform oversight</p>
            </div>

            {/* KPIs — org count is live */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, animation: "fadeUp .28s .06s both" }}>
                <KpiCard icon={Building2} accent="cyan"   value={orgCount} label="Organizations" />
                <KpiCard icon={BarChart2} accent="purple" value="—"        label="Org Admins (listing coming)" />
                <KpiCard icon={ScrollText} accent="green" value="—"        label="Total Elections (coming)" />
            </div>

            {/* Action cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, animation: "fadeUp .28s .1s both" }}>
                {ACTION_CARDS.map(card => {
                    const Icon = card.icon;
                    const a    = ACCENT_COLORS[card.color] ?? ACCENT_COLORS.gray;
                    return (
                        <div
                            key={card.title}
                            onClick={() => card.enabled && navigate(card.path)}
                            style={{
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 12, padding: 20,
                                cursor: card.enabled ? "pointer" : "not-allowed",
                                opacity: card.enabled ? 1 : .5,
                                transition: "border-color .15s",
                            }}
                            onMouseEnter={ev => { if (card.enabled) ev.currentTarget.style.borderColor = a.hover; }}
                            onMouseLeave={ev => { ev.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                                <Icon size={18} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{card.title}</div>
                            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 5, lineHeight: 1.5 }}>{card.desc}</div>
                            <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 600, color: card.enabled ? a.color : "var(--orange)" }}>
                                {card.enabled ? "Open →" : "⚠ API coming soon"}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
        </SuperAdminLayout>
    );
}
