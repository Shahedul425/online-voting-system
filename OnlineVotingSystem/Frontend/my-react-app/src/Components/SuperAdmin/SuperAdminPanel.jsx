import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    UserCog,
    ShieldCheck,
    Activity,
    ScrollText,
    BarChart2,
} from "lucide-react";

function Card({ title, desc, icon: Icon, onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            className={[
                "rounded-2xl border p-6 text-left transition w-full",
                disabled
                    ? "border-white/10 bg-white/5 opacity-60 cursor-not-allowed"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-400/40",
            ].join(" ")}
        >
            <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                    <Icon className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                    <div className="text-base font-semibold text-white/90">{title}</div>
                    <div className="mt-1 text-sm text-white/60">{desc}</div>
                </div>
            </div>

            {disabled ? (
                <div className="mt-4 text-xs text-amber-300">Not wired yet (API coming soon)</div>
            ) : (
                <div className="mt-4 text-xs text-white/50">Open →</div>
            )}
        </button>
    );
}

export default function SuperAdminPanel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-6xl">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-300" />
                        <span className="text-sm text-white/80">OVM • Super Admin</span>
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Platform Console</h1>
                    <p className="mt-2 text-sm text-white/60">
                        Organization management and platform oversight.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <Card
                        title="Organizations"
                        desc="Create organizations and manage domains."
                        icon={Building2}
                        onClick={() => navigate("/superadmin/orgs")}
                    />

                    <Card
                        title="Assign Org Admin"
                        desc="Promote a user to org admin."
                        icon={UserCog}
                        onClick={() => navigate("/superadmin/orgs/assign-admin")}
                    />

                    {/* Below are “future” cards */}
                    <Card
                        title="Global Audit Logs"
                        desc="Search all audits across the platform."
                        icon={ScrollText}
                        disabled
                    />
                    <Card
                        title="System Health"
                        desc="Batch jobs, imports, and background tasks."
                        icon={Activity}
                        disabled
                    />
                    <Card
                        title="Platform Analytics"
                        desc="Elections, turnout, and integrity metrics."
                        icon={BarChart2}
                        disabled
                    />
                </div>
            </div>
        </div>
    );
}
