"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

import { OVS } from "../../../Service/Api/endpoints";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import { InlineFieldError } from "../../Errors/InFieldError.jsx";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../../Service/Api/formErrorHelpers.js";
import { withUnwrap } from "../../../Service/Api/apiUnwrap.js";

function toLocalInputValue(value) {
    if (!value) return "";
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
            d.getMinutes()
        )}`;
    } catch {
        return "";
    }
}

function toIsoOrNull(datetimeLocalValue) {
    if (!datetimeLocalValue) return null;
    try {
        const d = new Date(datetimeLocalValue);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
    } catch {
        return null;
    }
}

export default function AdminUpdateElection() {
    const navigate = useNavigate();
    const { electionId } = useParams();

    const [booting, setBooting] = useState(true);
    const [busy, setBusy] = useState(false);

    const [successMsg, setSuccessMsg] = useState("");
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const [original, setOriginal] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        startTime: "",
        endTime: "",
    });

    const status = useMemo(
        () => (original?.status ? String(original.status).toLowerCase() : ""),
        [original]
    );

    const canEdit = !status || status === "draft"; // UI guard

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setError(null);
        setSuccessMsg("");
        setFieldErrors((p) => ({ ...p, [name]: "" }));
    };

    useEffect(() => {
        let alive = true;

        async function load() {
            setError(null);
            setSuccessMsg("");
            setBooting(true);

            if (!electionId) {
                setBooting(false);
                setError(toAppError({ status: 400, message: "Missing electionId in URL." }));
                return;
            }

            try {
                const e = await withUnwrap(OVS.getElectionById({ id: electionId }));
                if (!alive) return;

                setOriginal(e);

                setForm({
                    name: e?.name || "",
                    description: e?.description || "",
                    startTime: toLocalInputValue(e?.startTime),
                    endTime: toLocalInputValue(e?.endTime),
                });
            } catch (err) {
                if (!alive) return;
                setError(toAppError(err));
            } finally {
                if (!alive) return;
                setBooting(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [electionId]);

    const validate = () => {
        const fe = {};

        // Since backend allows partial updates, name isn't strictly required,
        // but UX-wise you probably want it not empty.
        if (!form.name.trim()) fe.name = "Election name is required.";

        const startIso = toIsoOrNull(form.startTime);
        const endIso = toIsoOrNull(form.endTime);

        if (form.startTime && !startIso) fe.startTime = "Invalid start time.";
        if (form.endTime && !endIso) fe.endTime = "Invalid end time.";

        if (startIso && endIso) {
            const s = new Date(startIso).getTime();
            const t = new Date(endIso).getTime();
            if (t <= s) fe.endTime = "End time must be after start time.";
        }

        setFieldErrors(fe);
        return Object.keys(fe).length === 0;
    };

    const buildUpdatePayload = () => {
        // Only send fields you intend to update (partial update friendly)
        const payload = {};

        const name = form.name.trim();
        const desc = form.description?.trim();

        if (name !== (original?.name || "")) payload.name = name;
        if ((desc || "") !== (original?.description || "")) payload.description = desc || "";

        const startIso = toIsoOrNull(form.startTime);
        const endIso = toIsoOrNull(form.endTime);

        // Compare using ISO-ish so we don't send unchanged values
        const originalStart = original?.startTime ? new Date(original.startTime).toISOString() : null;
        const originalEnd = original?.endTime ? new Date(original.endTime).toISOString() : null;

        if (startIso !== originalStart) payload.startTime = startIso; // can be null if you later allow clearing
        if (endIso !== originalEnd) payload.endTime = endIso;

        return payload;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg("");
        setFieldErrors({});

        if (!canEdit) {
            setError(
                toAppError({
                    status: 400,
                    code: "ELECTION_NOT_EDITABLE",
                    message: "Only draft elections can be edited.",
                })
            );
            return;
        }

        if (!validate()) return;

        const payload = buildUpdatePayload();
        if (Object.keys(payload).length === 0) {
            setSuccessMsg("No changes to save.");
            return;
        }

        setBusy(true);
        try {
            const updated = await withUnwrap(OVS.updateElection({ id: electionId, payload }));

            // If backend returns the updated election, refresh local snapshot:
            if (updated && typeof updated === "object") setOriginal(updated);

            setSuccessMsg("Election updated successfully.");
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors((cur) => mergeFieldErrors(cur, appErr));
        } finally {
            setBusy(false);
        }
    };

    if (booting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
                <div className="flex items-center gap-2 text-white/70">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading election…
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-3xl">
                <button
                    onClick={() => navigate(`/admin/elections/${electionId}`)}
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to election
                </button>

                <div className="mt-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <span className="text-sm text-white/80">Admin • Update Election</span>
                        {status ? (
                            <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                {status}
              </span>
                        ) : null}
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Edit election</h1>
                    <p className="mt-2 text-sm text-white/60">
                        Editable when status is <span className="font-semibold">draft</span>.
                    </p>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                {successMsg ? (
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                            <div className="min-w-0">
                                <div className="font-semibold">Saved</div>
                                <div className="mt-1 text-sm text-emerald-100/90">{successMsg}</div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {!canEdit ? (
                    <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
                        <div className="font-semibold">Read-only</div>
                        <div className="mt-1 text-sm text-amber-100/80">
                            This election is <span className="font-semibold">{status || "not draft"}</span>. Editing is disabled.
                        </div>
                    </div>
                ) : null}

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
                            disabled={!canEdit}
                            placeholder="Student Council Election 2026"
                            className={[
                                "mt-2 w-full rounded-xl border px-4 py-3 outline-none",
                                "bg-zinc-900/60 border-white/10 focus:border-indigo-400/60",
                                !canEdit ? "opacity-60 cursor-not-allowed" : "",
                                fieldErrors.name ? "border-red-500/50" : "",
                            ].join(" ")}
                        />
                        <InlineFieldError message={fieldErrors.name} />
                    </div>

                    <div>
                        <label className="text-sm text-white/80">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={onChange}
                            disabled={!canEdit}
                            rows={3}
                            placeholder="Brief description..."
                            className={[
                                "mt-2 w-full rounded-xl border px-4 py-3 outline-none",
                                "bg-zinc-900/60 border-white/10 focus:border-indigo-400/60",
                                !canEdit ? "opacity-60 cursor-not-allowed" : "",
                                fieldErrors.description ? "border-red-500/50" : "",
                            ].join(" ")}
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
                                disabled={!canEdit}
                                className={[
                                    "mt-2 w-full rounded-xl border px-4 py-3 outline-none",
                                    "bg-zinc-900/60 border-white/10 focus:border-indigo-400/60",
                                    !canEdit ? "opacity-60 cursor-not-allowed" : "",
                                    fieldErrors.startTime ? "border-red-500/50" : "",
                                ].join(" ")}
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
                                disabled={!canEdit}
                                className={[
                                    "mt-2 w-full rounded-xl border px-4 py-3 outline-none",
                                    "bg-zinc-900/60 border-white/10 focus:border-indigo-400/60",
                                    !canEdit ? "opacity-60 cursor-not-allowed" : "",
                                    fieldErrors.endTime ? "border-red-500/50" : "",
                                ].join(" ")}
                            />
                            <InlineFieldError message={fieldErrors.endTime} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/elections/${electionId}`)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={!canEdit || busy}
                            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400 transition disabled:opacity-60"
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {busy ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-xs text-white/40">
                    Endpoint: <span className="font-mono">POST /election/update?id=&lt;electionId&gt;</span> • Body matches{" "}
                    <span className="font-mono">ElectionUpdateRequest</span>
                </div>
            </div>
        </div>
    );
}
