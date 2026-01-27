import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OVS } from "../../../Service/Api/endpoints";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import { InlineFieldError } from "../../Errors/InFieldError.jsx";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../../Service/Api/formErrorHelpers.js";
import { withUnwrap } from "../../../Service/Api/apiUnwrap.js";
import { useAppStore } from "../../../Service/GlobalState/appStore";

export default function AdminCreateElection() {
    const navigate = useNavigate();
    const { me } = useAppStore();

    const [form, setForm] = useState({
        name: "",
        description: "",
        electionType: "general",
        startTime: "",
        endTime: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    function onChange(e) {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        if (!me?.organization?.id && !me?.organizationId) {
            setError(toAppError({ error: { message: "Missing org. Please refresh /me." } }));
            return;
        }

        const orgId = me?.organization?.id || me?.organizationId;

        setLoading(true);
        try {
            const payload = {
                ...form,
                organizationId: orgId, // if your ElectionRequest needs it
            };

            const created = await withUnwrap(OVS.createElection ? OVS.createElection(payload) : OVS.electionCreate(payload));
            navigate(`/admin/elections/current`);
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors((cur) => mergeFieldErrors(cur, appErr));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-2xl">
                <h1 className="text-3xl font-extrabold text-indigo-400">Create Election</h1>
                <p className="mt-2 text-sm text-white/60">Set up a new election for your organization.</p>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                <form
                    onSubmit={onSubmit}
                    className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur space-y-4"
                >
                    <div>
                        <label className="text-sm text-white/80">Election Name</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            placeholder="Student Council Election 2026"
                        />
                        <InlineFieldError message={fieldErrors.name} />
                    </div>

                    <div>
                        <label className="text-sm text-white/80">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={onChange}
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            placeholder="Brief description..."
                        />
                        <InlineFieldError message={fieldErrors.description} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-white/80">Start Time</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={form.startTime}
                                onChange={onChange}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            <InlineFieldError message={fieldErrors.startTime} />
                        </div>

                        <div>
                            <label className="text-sm text-white/80">End Time</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                value={form.endTime}
                                onChange={onChange}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            <InlineFieldError message={fieldErrors.endTime} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition"
                        >
                            Cancel
                        </button>

                        <button
                            disabled={loading}
                            type="submit"
                            className="ml-auto rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400 transition disabled:opacity-60"
                        >
                            {loading ? "Creating..." : "Create Election"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
