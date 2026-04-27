// src/pages/superadmin/OrgCreate.jsx
import { useState } from "react";
import { Building2 } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../Service/Api/formErrorHelpers";
import SuperAdminLayout from "../layout/SuperAdminLayout.jsx";
import { Panel, FormGroup, Input, Select, Btn, ErrorBanner, SuccessBanner, HintBox } from "../ui";

export default function OrgCreate() {
    const [form, setForm] = useState({ name: "", type: "", country: "", domain: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError]   = useState(null);
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    function onChange(e) {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setFieldErrors(p => ({ ...p, [e.target.name]: "" }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null); setSuccess(""); setFieldErrors({});

        setLoading(true);
        try {
            // POST /superadmin/org/create → OrganizationRequest
            const msg = await withUnwrap(OVS.createOrganization({
                name:           form.name,
                type:           form.type,
                country:        form.country,
                allowedDomains: [form.domain].filter(Boolean),
            }));
            setSuccess(typeof msg === "string" ? msg : "Organization created successfully.");
            setForm({ name: "", type: "", country: "", domain: "" });
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors(p => mergeFieldErrors(p, appErr));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SuperAdminLayout
            breadcrumbs={[{ label: "SuperAdmin", path: "/superAdmin" }, { label: "Organizations" }, { label: "Create" }]}
        >
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} style={{ color: "var(--cyan)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--t3)" }}>SuperAdmin / Organizations / Create</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Create Organization</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    Add a new organization so users can be auto-mapped by email domain.
                </p>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 280px" }}>
                <Panel title="Organization Details" subtitle="POST /superadmin/org/create">
                    {success && <SuccessBanner title="Created" message={success} onClose={() => setSuccess("")} />}
                    <ErrorBanner error={error} onClose={() => setError(null)} />

                    <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
                        <FormGroup label="Organization Name" required error={fieldErrors.name}>
                            <Input name="name" value={form.name} onChange={onChange}
                                   placeholder="London South Bank University" error={!!fieldErrors.name} />
                        </FormGroup>

                        <div className="grid grid-cols-2 gap-3">
                            <FormGroup label="Type" required error={fieldErrors.type}>
                                <Select name="type" value={form.type} onChange={onChange} error={!!fieldErrors.type}>
                                    <option value="">Select type…</option>
                                    <option value="University">University</option>
                                    <option value="Company">Company</option>
                                    <option value="Non-profit">Non-profit</option>
                                    <option value="Government">Government</option>
                                </Select>
                            </FormGroup>
                            <FormGroup label="Country" required error={fieldErrors.country}>
                                <Input name="country" value={form.country} onChange={onChange}
                                       placeholder="UK" error={!!fieldErrors.country} />
                            </FormGroup>
                        </div>

                        <FormGroup
                            label="Email Domain"
                            required
                            hint="Format: example.com (no @ or https). Users registering with this domain are auto-mapped to this org."
                            error={fieldErrors.domain || fieldErrors.allowedDomains}
                        >
                            <Input name="domain" value={form.domain} onChange={onChange}
                                   placeholder="lsbu.ac.uk" error={!!(fieldErrors.domain || fieldErrors.allowedDomains)} />
                        </FormGroup>

                        <div className="flex gap-3 pt-2">
                            <Btn variant="ghost" type="button" onClick={() => setForm({ name: "", type: "", country: "", domain: "" })}>
                                Clear
                            </Btn>
                            <Btn variant="primary" type="submit" loading={loading} className="ml-auto">
                                Create Organization →
                            </Btn>
                        </div>
                    </form>
                </Panel>

                <div className="flex flex-col gap-3">
                    <Panel title="What this does">
                        {[
                            "Creates an organization in the database with name, type, and country.",
                            "Registers the email domain so users with that domain are auto-mapped on registration.",
                            "Prevents duplicate domains across organizations.",
                            "Audit logged with your actor ID.",
                        ].map((t, i) => (
                            <div key={i} className="flex items-start gap-2 py-2"
                                 style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                                <span style={{ color: "var(--cyan)", fontSize: 13, flexShrink: 0 }}>→</span>
                                <span style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>{t}</span>
                            </div>
                        ))}
                    </Panel>
                    <Panel title="OrganizationRequest">
            <pre style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--cyan)", lineHeight: 1.8 }}>
{`name:           String *
type:           String *
country:        String *
allowedDomains: String[]`}
            </pre>
                    </Panel>
                </div>
            </div>
        </SuperAdminLayout>
    );
}


// ─── AssignOrgAdmin ──────────────────────────────────────────────────────────
// src/pages/superadmin/AssignOrgAdmin.jsx (exported separately for clarity)
import { useState as useStateAssign } from "react";
import { UserCog } from "lucide-react";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AssignOrgAdmin() {
    const [form, setForm]           = useStateAssign({ email: "", orgId: "" });
    const [fieldErrors, setFieldErrors] = useStateAssign({});
    const [error, setError]         = useStateAssign(null);
    const [success, setSuccess]     = useStateAssign("");
    const [loading, setLoading]     = useStateAssign(false);

    function onChange(e) {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setFieldErrors(p => ({ ...p, [e.target.name]: "" }));
    }

    function validate() {
        const fe = {};
        if (!form.email.includes("@"))     fe.email = "Enter a valid email.";
        if (!UUID_RE.test(form.orgId.trim())) fe.orgId = "Must be a valid UUID.";
        return fe;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null); setSuccess(""); setFieldErrors({});
        const fe = validate();
        if (Object.keys(fe).length > 0) { setFieldErrors(fe); return; }

        setLoading(true);
        try {
            // POST /superadmin/org/assign/admin?email=&orgId=
            const msg = await withUnwrap(OVS.assignOrgAdmin({ email: form.email.trim(), orgId: form.orgId.trim() }));
            setSuccess(typeof msg === "string" ? msg : "Admin assigned successfully.");
            setForm({ email: "", orgId: "" });
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors(p => mergeFieldErrors(p, appErr));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SuperAdminLayout
            breadcrumbs={[{ label: "SuperAdmin", path: "/superAdmin" }, { label: "Organizations" }, { label: "Assign Admin" }]}
        >
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <UserCog size={16} style={{ color: "var(--purple)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--t3)" }}>SuperAdmin / Organizations / Assign Admin</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Assign Org Admin</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    Promote a registered user to admin for their organization.
                </p>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 260px" }}>
                <Panel title="Promote an Admin" subtitle="POST /superadmin/org/assign/admin">
                    {success && <SuccessBanner title="Success" message={success} onClose={() => setSuccess("")} />}
                    <ErrorBanner error={error} onClose={() => setError(null)} />

                    <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
                        <FormGroup label="User Email" required error={fieldErrors.email}
                                   hint="Must be a registered user whose email domain matches the target organization">
                            <Input name="email" type="email" value={form.email} onChange={onChange}
                                   placeholder="user@lsbu.ac.uk" error={!!fieldErrors.email} />
                        </FormGroup>

                        <FormGroup label="Organization ID (UUID)" required error={fieldErrors.orgId}>
                            <Input name="orgId" value={form.orgId} onChange={onChange}
                                   placeholder="dc80361a-1dcd-4538-8302-7a30970e1003"
                                   style={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                                   error={!!fieldErrors.orgId} />
                        </FormGroup>

                        <HintBox type="warning">
                            This operation also updates <strong style={{ color: "var(--t1)" }}>Keycloak roles</strong> —
                            granting <code style={{ color: "var(--cyan)" }}>admin</code> and revoking{" "}
                            <code style={{ color: "var(--cyan)" }}>voter</code>. The user's email domain must match
                            the organization's registered domain.
                        </HintBox>

                        <div className="flex gap-3 pt-2">
                            <Btn variant="ghost" type="button" onClick={() => setForm({ email: "", orgId: "" })}>Clear</Btn>
                            <Btn variant="primary" type="submit" loading={loading} className="ml-auto">
                                Assign Admin →
                            </Btn>
                        </div>
                    </form>
                </Panel>

                <Panel title="What happens">
                    {[
                        ["1", "Validates email domain matches organization"],
                        ["2", "Updates user role to admin in DB"],
                        ["3", "Grants admin realm role in Keycloak"],
                        ["4", "Revokes voter realm role"],
                        ["5", "Audit logged with actor ID and org"],
                    ].map(([n, t]) => (
                        <div key={n} className="flex items-start gap-2.5 py-2.5"
                             style={{ borderBottom: Number(n) < 5 ? "1px solid var(--border)" : "none" }}>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                 style={{ background: "var(--purple-d)", color: "var(--purple)", marginTop: 1 }}>
                                {n}
                            </div>
                            <span style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>{t}</span>
                        </div>
                    ))}
                </Panel>
            </div>
        </SuperAdminLayout>
    );
}
