import React, { useState } from "react";
import { UserCog, Loader2 } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { withUnwrap } from "../../../Service/Api/apiUnwrap.js";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import { InlineFieldError } from "../../Errors/InFieldError.jsx";
import { mergeFieldErrors } from "../../../Service/Api/formErrorHelpers.js";

const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function AssignOrgAdmin() {
    const [form, setForm] = useState({ email: "", orgId: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState(null);

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    function onChange(e) {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setFieldErrors((p) => ({ ...p, [e.target.name]: "" }));
    }

    function validate() {
        const fe = {};
        const email = form.email.trim();
        const orgId = form.orgId.trim();
        if (!email.includes("@")) fe.email = "Enter a valid email.";
        if (!uuidRegex.test(orgId)) fe.orgId = "orgId must be a valid UUID.";
        return fe;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccessMsg("");
        setFieldErrors({});

        const fe = validate();
        if (Object.keys(fe).length > 0) {
            setFieldErrors(fe);
            return;
        }

        setLoading(true);
        try {
            const data = await withUnwrap(
                OVS.assignOrgAdmin({ email: form.email.trim(), orgId: form.orgId.trim() })
            );
            setSuccessMsg(typeof data === "string" ? data : "Admin assigned.");
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors((cur) => mergeFieldErrors(cur, appErr));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-xl">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <UserCog className="h-4 w-4 text-indigo-300" />
                        <span className="text-sm text-white/80">Assign Org Admin</span>
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Promote an Admin</h1>
                    <p className="mt-2 text-sm text-white/60">
                        Assign an admin to an organization by email and orgId.
                    </p>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    <ErrorBanner error={error} onClose={() => setError(null)} className="mb-4" />

                    {successMsg ? (
                        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                            <div className="font-semibold">Success</div>
                            <div className="mt-1 text-sm text-emerald-100/90">{successMsg}</div>
                        </div>
                    ) : null}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-white/80">User Email</label>
                            <input
                                name="email"
                                value={form.email}
                                onChange={onChange}
                                placeholder="user@lsbu.ac.uk"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            <InlineFieldError message={fieldErrors.email} />
                        </div>

                        <div>
                            <label className="text-sm text-white/80">Organization ID (UUID)</label>
                            <input
                                name="orgId"
                                value={form.orgId}
                                onChange={onChange}
                                placeholder="dc80361a-1dcd-4538-8302-7a30970e1003"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            <InlineFieldError message={fieldErrors.orgId} />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </span>
                            ) : (
                                "Assign Admin"
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-xs text-white/50">
                        Note: This endpoint currently accepts query params <span className="font-mono">email</span> and{" "}
                        <span className="font-mono">orgId</span>.
                    </div>
                </div>
            </div>
        </div>
    );
}
