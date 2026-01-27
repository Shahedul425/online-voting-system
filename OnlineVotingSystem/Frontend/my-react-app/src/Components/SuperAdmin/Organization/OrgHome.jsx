import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, PlusCircle, UserCog } from "lucide-react";

export default function OrganizationsHome() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-4xl">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <Building2 className="h-4 w-4 text-indigo-300" />
                        <span className="text-sm text-white/80">Organizations</span>
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Organization Management</h1>
                    <p className="mt-2 text-sm text-white/60">
                        Create orgs and assign admins. Listing/search will be added when APIs are ready.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => navigate("/superadmin/orgs/create")}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/10 hover:border-indigo-400/40 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                                <PlusCircle className="h-5 w-5 text-emerald-300" />
                            </div>
                            <div>
                                <div className="text-base font-semibold text-white/90">Create Organization</div>
                                <div className="mt-1 text-sm text-white/60">Add org and domain mapping.</div>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-white/50">Open →</div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/superadmin/orgs/assign-admin")}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/10 hover:border-indigo-400/40 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                                <UserCog className="h-5 w-5 text-indigo-300" />
                            </div>
                            <div>
                                <div className="text-base font-semibold text-white/90">Assign Admin</div>
                                <div className="mt-1 text-sm text-white/60">Promote user by email to org admin.</div>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-white/50">Open →</div>
                    </button>
                </div>
            </div>
        </div>
    );
}
