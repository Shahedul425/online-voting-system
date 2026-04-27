// src/Components/Admin/Election/AdminCreateElection.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, PlusCircle } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../../Service/Api/formErrorHelpers";
import { withUnwrap } from "../../../Service/Api/apiUnwrap";
import AdminLayout from "../../../components/layout/AdminLayout";
import {
    Panel, FormGroup, Input, Textarea, Select, Btn,
    ErrorBanner, HintBox, InfoRow,
} from "../../ui";

const ELECTION_TYPES = ["general", "committee", "referendum", "by-election"];

export default function AdminCreateElection() {
    const navigate = useNavigate();
    const me       = useAppStore(s => s.me);
    const setElection = useAppStore(s => s.setElection);

    const [form, setForm] = useState({
        name: "", description: "", electionType: "general",
        startTime: "", endTime: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError]   = useState(null);
    const [loading, setLoading] = useState(false);

    function onChange(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setFieldErrors(p => ({ ...p, [name]: "" }));
        setError(null);
    }

    function validate() {
        const fe = {};
        if (!form.name.trim())         fe.name = "Election name is required.";
        if (!form.electionType)        fe.electionType = "Election type is required.";
        if (!form.startTime)           fe.startTime = "Start time is required.";
        if (!form.endTime)             fe.endTime = "End time is required.";
        if (form.startTime && form.endTime && form.endTime <= form.startTime)
            fe.endTime = "End time must be after start time.";
        setFieldErrors(fe);
        return Object.keys(fe).length === 0;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        if (!validate()) return;

        setLoading(true);
        try {
            // POST /admin/election/create → ElectionRequest
            // organizationId comes from /user/me so the admin can't forge it
            const created = await withUnwrap(
                OVS.createElection({
                    name:           form.name.trim(),
                    description:    form.description.trim() || null,
                    electionType:   form.electionType,
                    organizationId: me?.organizationId,
                    startTime:      form.startTime ? new Date(form.startTime).toISOString() : null,
                    endTime:        form.endTime   ? new Date(form.endTime).toISOString()   : null,
                })
            );
            setElection(created);
            // Bug-fix note: was navigating to /admin/elections/current (non-existent)
            navigate(`/admin/elections/${created.id}`, { replace: true });
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors(p => mergeFieldErrors(p, appErr));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin", path: "/admin" },
                { label: "Elections", path: "/admin/elections/status?status=draft" },
                { label: "Create" },
            ]}
        >
            <div className="flex items-center gap-2 animate-up">
                <PlusCircle size={16} style={{ color: "var(--purple)" }} />
                <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Elections · Create</span>
            </div>

            <div className="animate-up">
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>
                    Create Election
                </h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    After creation, upload voters and candidates while the election is in draft.
                </p>
            </div>

            <div className="grid gap-4 animate-up-2" style={{ gridTemplateColumns: "1fr 280px" }}>
                {/* Form */}
                <Panel title="Election Details" subtitle="POST /admin/election/create · ElectionRequest">
                    <ErrorBanner error={error} onClose={() => setError(null)} />

                    <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
                        <FormGroup label="Election Name" required error={fieldErrors.name}>
                            <Input
                                name="name" value={form.name} onChange={onChange}
                                placeholder="e.g. Student Council Election 2026"
                                error={!!fieldErrors.name}
                            />
                        </FormGroup>

                        <FormGroup label="Description" error={fieldErrors.description}>
                            <Textarea
                                name="description" value={form.description} onChange={onChange}
                                placeholder="Brief description of this election…"
                                rows={3}
                            />
                        </FormGroup>

                        <FormGroup label="Election Type" required error={fieldErrors.electionType}>
                            <Select name="electionType" value={form.electionType} onChange={onChange}>
                                {ELECTION_TYPES.map(t => (
                                    <option key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </option>
                                ))}
                            </Select>
                        </FormGroup>

                        <div className="grid grid-cols-2 gap-3">
                            <FormGroup label="Start Time" required error={fieldErrors.startTime}>
                                <Input
                                    name="startTime" type="datetime-local"
                                    value={form.startTime} onChange={onChange}
                                    error={!!fieldErrors.startTime}
                                />
                            </FormGroup>
                            <FormGroup label="End Time" required error={fieldErrors.endTime}>
                                <Input
                                    name="endTime" type="datetime-local"
                                    value={form.endTime} onChange={onChange}
                                    error={!!fieldErrors.endTime}
                                />
                            </FormGroup>
                        </div>

                        <HintBox type="info">
              <span className="flex items-center gap-1.5">
                <CalendarClock size={12} style={{ flexShrink: 0 }} />
                <span>
                  <strong style={{ color: "var(--t1)" }}>Important:</strong> The organization ID is
                  automatically set from your admin account — you cannot create elections outside your org.
                </span>
              </span>
                        </HintBox>

                        <div className="flex gap-3 pt-1">
                            <Btn variant="ghost" type="button" onClick={() => navigate("/admin/elections/status?status=draft")}>
                                Cancel
                            </Btn>
                            <Btn variant="primary" type="submit" loading={loading} className="ml-auto">
                                {loading ? "Creating…" : "Create Election →"}
                            </Btn>
                        </div>
                    </form>
                </Panel>

                {/* Right info */}
                <div className="flex flex-col gap-3">
                    <Panel title="After creation">
                        {[
                            ["1", "Upload voters CSV",      "Import the eligible voter list (draft only)"],
                            ["2", "Upload candidates CSV",  "Import candidates per position (draft only)"],
                            ["3", "Review everything",      "Check voter + candidate lists"],
                            ["4", "Start the election",     "Voters can then begin casting ballots"],
                        ].map(([n, title, sub]) => (
                            <div key={n} className="flex items-start gap-3 py-3"
                                 style={{ borderBottom: n !== "4" ? "1px solid var(--border)" : "none" }}>
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                                    style={{ background: "var(--purple-d)", color: "var(--purple)" }}
                                >
                                    {n}
                                </div>
                                <div>
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{title}</div>
                                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{sub}</div>
                                </div>
                            </div>
                        ))}
                    </Panel>

                    <Panel title="Your Organization">
                        <InfoRow label="Org ID" value={me?.organizationId ? String(me.organizationId).slice(0, 12) + "…" : "—"} mono />
                        <InfoRow label="Admin"  value={me?.email || "—"} last />
                    </Panel>
                </div>
            </div>
        </AdminLayout>
    );
}
