import React, { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { withUnwrap } from "../../../Service/Api/apiUnwrap.js";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import { InlineFieldError } from "../../Errors/InFieldError.jsx";
import { mergeFieldErrors } from "../../../Service/Api/formErrorHelpers.js";

export default function OrgCreate() {
    const [form, setForm] = useState({
        name: "",
        type: "",
        country: "",
        domain: "", // if your OrganizationRequest has it
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState(null);

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    function onChange(e) {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setFieldErrors((p) => ({ ...p, [e.target.name]: "" }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccessMsg("");
        setFieldErrors({});

        setLoading(true);
        try {
            const data = await withUnwrap(OVS.createOrganization(form));
            // your backend returns String message
            setSuccessMsg(typeof data === "string" ? data : "Organization created.");
            setForm({ name: "", type: "", country: "", domain: "" });
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
                        <Building2 className="h-4 w-4 text-indigo-300" />
                        <span className="text-sm text-white/80">Create Organization</span>
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">New Organization</h1>
                    <p className="mt-2 text-sm text-white/60">
                        Add a new organization so users can be auto-mapped by email domain.
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
                            <label className="text-sm text-white/80">Organization Name</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                placeholder="London South Bank University"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            <InlineFieldError message={fieldErrors.name} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm text-white/80">Type</label>
                                <input
                                    name="type"
                                    value={form.type}
                                    onChange={onChange}
                                    placeholder="University"
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                                />
                                <InlineFieldError message={fieldErrors.type} />
                            </div>

                            <div>
                                <label className="text-sm text-white/80">Country</label>
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={onChange}
                                    placeholder="UK"
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                                />
                                <InlineFieldError message={fieldErrors.country} />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-white/80">Email Domain</label>
                            <input
                                name="domain"
                                value={form.domain}
                                onChange={onChange}
                                placeholder="lsbu.ac.uk"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            <p className="mt-2 text-xs text-white/50">
                                Used during /user/findOrCreate to map users to the right org.
                            </p>
                            <InlineFieldError message={fieldErrors.domain} />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
                            ) : (
                                "Create Organization"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
