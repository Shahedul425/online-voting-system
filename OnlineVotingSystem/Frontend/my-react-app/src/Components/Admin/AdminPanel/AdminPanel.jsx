import React from "react";
import { useNavigate } from "react-router-dom";
import {
    PlusCircle,
    ListChecks,
    ShieldCheck,
    LogOut,
    FileClock,
    PlayCircle,
    PauseCircle,
    Lock,
    Archive,
} from "lucide-react";
import { AuthToken } from "../../../Service/GlobalState/authToken";
import { useAppStore } from "../../../Service/GlobalState/appStore";

export default function AdminPanel() {
    const navigate = useNavigate();
    const clearMe = useAppStore((s) => s.clearMe);
    const clearElection = useAppStore((s) => s.clearElection);

    function logout() {
        AuthToken.clear();      // sessionStorage access_token
        clearMe();
        clearElection();
        navigate("/signin", { replace: true });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center text-white px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-indigo-500 tracking-tight">OVM Admin</h1>
                <p className="text-gray-400 text-sm mt-1">Manage elections, uploads, lists and audit integrity</p>
            </div>

            <div className="w-full max-w-5xl bg-gray-800/90 border border-gray-700 rounded-2xl shadow-2xl p-8 space-y-10">
                {/* Primary */}
                <h2 className="text-xl font-semibold text-indigo-400 border-b border-gray-700 pb-2 text-center">
                    🗳️ Election Management
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <ActionCard
                        icon={<PlusCircle size={28} />}
                        title="Create Election"
                        subtitle="Create a new election for your organization"
                        onClick={() => navigate("/admin/elections/create")}
                    />

                    <ActionCard
                        icon={<ListChecks size={28} />}
                        title="Manage Elections"
                        subtitle="Browse by status and open an election workspace"
                        onClick={() => navigate("/admin/elections/status?status=draft")}
                    />

                    <ActionCard
                        icon={<Archive size={28} />}
                        title="Published Elections"
                        subtitle="View published results and history"
                        onClick={() => navigate("/admin/elections/status?status=published")}
                    />
                </div>

                {/* Status shortcuts */}
                <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-400 text-center">
                        Election Status Shortcuts
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <PillCard
                            icon={<FileClock className="h-5 w-5" />}
                            label="Draft"
                            hint="Upload lists & prepare"
                            onClick={() => navigate("/admin/elections/status?status=draft")}
                        />
                        <PillCard
                            icon={<PlayCircle className="h-5 w-5" />}
                            label="Running"
                            hint="Monitor activity"
                            onClick={() => navigate("/admin/elections/status?status=running")}
                        />
                        <PillCard
                            icon={<PauseCircle className="h-5 w-5" />}
                            label="Stopped"
                            hint="Resume or close"
                            onClick={() => navigate("/admin/elections/status?status=stopped")}
                        />
                        <PillCard
                            icon={<Lock className="h-5 w-5" />}
                            label="Closed"
                            hint="Ready to publish"
                            onClick={() => navigate("/admin/elections/status?status=closed")}
                        />
                        <PillCard
                            icon={<Archive className="h-5 w-5" />}
                            label="Published"
                            hint="Archived & visible"
                            onClick={() => navigate("/admin/elections/status?status=published")}
                        />
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-400">
                        Flow: pick a status → select an election → manage uploads, voters, candidates, audit, and lifecycle actions.
                    </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 pt-6 flex flex-col items-center text-center">
                    <ShieldCheck size={32} className="text-green-500 mb-2" />
                    <p className="text-xs text-gray-400 w-3/4">All actions are logged securely.</p>

                    <div className="flex justify-center pt-4 w-full">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 transition mt-2"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionCard({ icon, title, subtitle, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-6 px-4 shadow border border-gray-700 hover:border-indigo-400"
        >
            <div className="text-indigo-200">{icon}</div>
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-gray-400">{subtitle}</div>
        </button>
    );
}

function PillCard({ icon, label, hint, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900/60 hover:bg-indigo-600/25 hover:border-indigo-400 transition py-4"
        >
            <div className="text-indigo-200">{icon}</div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-[11px] text-gray-400">{hint}</div>
        </button>
    );
}
