// src/Components/Admin/Election/AdminUpdateElection.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Settings2, ArrowLeft } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../../Service/Api/formErrorHelpers";
import { withUnwrap } from "../../../Service/Api/apiUnwrap";
import AdminLayout from "../../../components/layout/AdminLayout";
import {
    Panel, FormGroup, Input, Textarea, Select, Btn,
    ErrorBanner, SuccessBanner, HintBox, Spinner,
} from "../../ui";

const ELECTION_TYPES = ["general", "committee", "referendum", "by-election"];

function toLocalDT(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        const pad = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
}

export default function AdminUpdateElection() {
    const { electionId } = useParams();
    const navigate        = useNavigate();

    const [election, setElection]     = useState(null);
    const [loadingPage, setLoadingPage] = useState(true);
    const [form, setForm]             = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError]           = useState(null);
    const [success, setSuccess]       = useState("");
    const [saving, setSaving]         = useState(false);
    const setAdminElection            = useAppStore(s => s.setElection);

    // Load election on mount
    useEffect(() => {
        let alive = true;
        async function load() {
            if (!electionId) return;
            try {
                const e = await withUnwrap(OVS.getElectionById({ id: electionId }));
                if (!alive) return;
                setElection(e);
                setForm({
                    name:         e.name         || "",
                    description:  e.description  || "",
                    electionType: e.electionType || "general",
                    startTime:    toLocalDT(e.startTime),
                    endTime:      toLocalDT(e.endTime),
                });
            } catch (err) {
                if (!alive) return;
                setError(toAppError(err));
            } finally {
                if (!alive) return;
                setLoadingPage(false);
            }
        }
        load();
        return () => { alive = false; };
    }, [electionId]);

    const isDraft = String(election?.status || "").toLowerCase() === "draft";

    function onChange(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setFieldErrors(p => ({ ...p, [name]: "" }));
        setError(null); setSuccess("");
    }

    function validate() {
        const fe = {};
        if (!form.name.trim())  fe.name = "Election name is required.";
        if (!form.startTime)    fe.startTime = "Start time is required.";
        if (!form.endTime)      fe.endTime   = "End time is required.";
        if (form.startTime && form.endTime && form.endTime <= form.startTime)
            fe.endTime = "End time must be after start time.";
        setFieldErrors(fe);
        return Object.keys(fe).length === 0;
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!isDraft) return;
        setError(null); setSuccess("");
        if (!validate()) return;

        setSaving(true);
        try {
            // PATCH /admin/election/update/{id} — or POST depending on backend
            const updated = await withUnwrap(
                OVS.updateElection({
                    id:           electionId,
                    name:         form.name.trim(),
                    description:  form.description.trim() || null,
                    electionType: form.electionType,
                    startTime:    form.startTime ? new Date(form.startTime).toISOString() : null,
                    endTime:      form.endTime   ? new Date(form.endTime).toISOString()   : null,
                })
            );
            setElection(updated ?? { ...election, ...form });
            setAdminElection(updated ?? { ...election, ...form });
            setSuccess("Election updated successfully.");
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors(p => mergeFieldErrors(p, appErr));
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin",      path: "/admin" },
                { label: "Elections",  path: "/admin/elections/status?status=draft" },
                { label: election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Update" },
            ]}
            topbarRight={
                <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                    <ArrowLeft size={12} /> Back to workspace
                </Btn>
            }
        >
            <div className="flex items-center gap-2 animate-up">
                <Settings2 size={15} style={{ color: "var(--purple)" }} />
                <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Election · Update</span>
            </div>

            {loadingPage ? (
                <Spinner text="Loading election…" />
            ) : (
                <div className="grid gap-4 animate-up-2" style={{ gridTemplateColumns: "1fr 260px" }}>
                    <Panel
                        title="Update Election"
                        subtitle={`PATCH /admin/election/update/${electionId} · draft only`}
                    >
                        {/* Draft guard banner */}
                        {!isDraft && (
                            <HintBox type="warning">
                                <strong style={{ color: "var(--t1)" }}>Read-only</strong> — election updates are only allowed
                                in <strong style={{ color: "var(--t1)" }}>draft</strong> status.
                                Current status: <strong style={{ color: "var(--orange)", textTransform: "uppercase" }}>
                                {election?.status || "unknown"}
                            </strong>.
                            </HintBox>
                        )}

                        {success && <SuccessBanner title="Saved" message={success} onClose={() => setSuccess("")} />}
                        <ErrorBanner error={error} onClose={() => setError(null)} />

                        {form && (
                            <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
                                <FormGroup label="Election Name" required error={fieldErrors.name}>
                                    <Input
                                        name="name" value={form.name} onChange={onChange}
                                        placeholder="e.g. Student Council Election 2026"
                                        disabled={!isDraft} error={!!fieldErrors.name}
                                    />
                                </FormGroup>

                                <FormGroup label="Description" error={fieldErrors.description}>
                                    <Textarea
                                        name="description" value={form.description} onChange={onChange}
                                        placeholder="Brief description…" rows={3} disabled={!isDraft}
                                    />
                                </FormGroup>

                                <FormGroup label="Election Type" required error={fieldErrors.electionType}>
                                    <Select name="electionType" value={form.electionType} onChange={onChange} disabled={!isDraft}>
                                        {ELECTION_TYPES.map(t => (
                                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                        ))}
                                    </Select>
                                </FormGroup>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormGroup label="Start Time" required error={fieldErrors.startTime}>
                                        <Input
                                            name="startTime" type="datetime-local"
                                            value={form.startTime} onChange={onChange}
                                            disabled={!isDraft} error={!!fieldErrors.startTime}
                                        />
                                    </FormGroup>
                                    <FormGroup label="End Time" required error={fieldErrors.endTime}>
                                        <Input
                                            name="endTime" type="datetime-local"
                                            value={form.endTime} onChange={onChange}
                                            disabled={!isDraft} error={!!fieldErrors.endTime}
                                        />
                                    </FormGroup>
                                </div>

                                {isDraft && (
                                    <div className="flex gap-3 pt-1">
                                        <Btn variant="ghost" type="button" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                                            Cancel
                                        </Btn>
                                        <Btn variant="primary" type="submit" loading={saving} className="ml-auto">
                                            {saving ? "Saving…" : "Save Changes →"}
                                        </Btn>
                                    </div>
                                )}
                            </form>
                        )}
                    </Panel>

                    {/* Info panel */}
                    <Panel title="Election Info">
                        <div style={{ fontSize: 11.5, marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--t3)", marginBottom: 6 }}>
                                ID
                            </div>
                            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--t2)", wordBreak: "break-all" }}>
                {election?.id || electionId}
              </span>
                        </div>
                        <HintBox type={isDraft ? "success" : "warning"}>
                            Status: <strong style={{ color: "var(--t1)", textTransform: "uppercase" }}>
                            {election?.status || "—"}
                        </strong>
                            {isDraft
                                ? " — editing is allowed."
                                : " — editing is locked."}
                        </HintBox>
                        <p style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 12, lineHeight: 1.6 }}>
                            Only name, description, type, and times can be changed.
                            Org association is immutable after creation.
                        </p>
                    </Panel>
                </div>
            )}
        </AdminLayout>
    );
}
