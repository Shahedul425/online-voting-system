// src/Components/SuperAdmin/OrgHome.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, PlusCircle, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { toAppError } from "../../Service/ErrorHandling/appError";
import SuperAdminLayout from "../layout/SuperAdminLayout.jsx";

// ── Tiny inline primitives (avoids import-path issues) ───────────────────────
function Btn({ variant = "ghost", size = "md", children, loading, disabled, onClick, type = "button" }) {
    const sizes = {
        sm: { fontSize: 11, padding: "5px 10px" },
        md: { fontSize: 12, padding: "7px 14px" },
        lg: { fontSize: 13.5, padding: "11px 24px", borderRadius: 10 },
    };
    const variants = {
        ghost:   { background: "transparent", border: "1px solid var(--border)", color: "var(--t2)" },
        primary: { background: "linear-gradient(135deg,var(--purple),#9b6ff7)", color: "#fff", border: "none" },
        success: { background: "var(--green-d)", border: "1px solid var(--green-b)", color: "var(--green)" },
        danger:  { background: "var(--red-d)", border: "1px solid rgba(247,111,111,.3)", color: "var(--red)" },
        cyan:    { background: "var(--cyan-d)", border: "1px solid rgba(77,217,232,.25)", color: "var(--cyan)" },
    };
    return (
        <button
            type={type} onClick={onClick}
            disabled={disabled || loading}
            style={{
                ...variants[variant], ...sizes[size],
                borderRadius: 8, fontWeight: 600,
                cursor: disabled || loading ? "not-allowed" : "pointer",
                opacity: disabled || loading ? .55 : 1,
                display: "inline-flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", transition: "all .15s",
            }}
        >
            {loading && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
            {children}
        </button>
    );
}

// ── Assign Admin Modal ────────────────────────────────────────────────────────
function AssignAdminModal({ org, onClose, onSuccess }) {
    const [email, setEmail]     = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [success, setSuccess] = useState(false);

    // Extract domain as user types and check against org domains
    const typedDomain = useMemo(() => {
        const parts = email.trim().split("@");
        return parts.length === 2 && parts[1].includes(".") ? parts[1].toLowerCase() : null;
    }, [email]);

    const domainMatches = useMemo(() => {
        if (!typedDomain || !org?.allowedDomains?.length) return null;
        return org.allowedDomains.some(d => d.toLowerCase() === typedDomain);
    }, [typedDomain, org]);

    async function submit() {
        setError(null);
        if (!email.trim()) { setError({ message: "Email is required." }); return; }
        if (!email.includes("@")) { setError({ message: "Enter a valid email address." }); return; }

        setLoading(true);
        try {
            // POST /superadmin/org/assign/admin?email=&orgId=
            await withUnwrap(OVS.assignOrgAdmin({
                email: email.trim().toLowerCase(),
                orgId: org.id,
            }));
            setSuccess(true);
            setTimeout(() => { onSuccess?.(); onClose(); }, 1400);
        } catch (err) {
            setError(toAppError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,.65)",
                zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 14, width: "100%", maxWidth: 460, overflow: "hidden",
                }}
            >
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>Assign Admin</div>
                        <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 2 }}>{org.name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer" }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Org domain pills */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 6 }}>
                            Registered Domains
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {(org.allowedDomains || []).map(d => (
                                <span key={d} style={{ fontSize: 11, fontFamily: "JetBrains Mono", padding: "3px 9px", borderRadius: 20, background: "var(--cyan-d)", color: "var(--cyan)", border: "1px solid rgba(77,217,232,.2)" }}>
                  @{d}
                </span>
                            ))}
                        </div>
                    </div>

                    {/* Email input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>
                            User Email <span style={{ color: "var(--red)" }}>*</span>
                        </label>
                        <input
                            value={email}
                            autoFocus
                            onChange={e => { setEmail(e.target.value); setError(null); setSuccess(false); }}
                            placeholder={`user@${org.allowedDomains?.[0] ?? "example.com"}`}
                            onKeyDown={e => e.key === "Enter" && submit()}
                            style={{
                                background: "var(--surface-2)",
                                border: `1px solid ${error ? "rgba(247,111,111,.4)" : "var(--border)"}`,
                                borderRadius: 8, padding: "10px 14px",
                                color: "var(--t1)", fontSize: 13, fontFamily: "Inter", outline: "none", width: "100%",
                            }}
                            onFocus={e  => e.target.style.borderColor = "var(--purple-b)"}
                            onBlur={e   => e.target.style.borderColor = error ? "rgba(247,111,111,.4)" : "var(--border)"}
                        />

                        {/* Live domain hint */}
                        {typedDomain && (
                            <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5,
                                color: domainMatches === null ? "var(--t3)" : domainMatches ? "var(--green)" : "var(--orange)" }}>
                                {domainMatches === true  && <><CheckCircle2 size={12} /> Domain <strong>@{typedDomain}</strong> matches this org ✓</>}
                                {domainMatches === false && <><AlertTriangle size={12} /> Domain <strong>@{typedDomain}</strong> doesn't match — backend will reject</>}
                            </div>
                        )}

                        <div style={{ fontSize: 11, color: "var(--t3)" }}>
                            The user must already be registered. Backend also verifies domain match.
                        </div>
                    </div>

                    {/* What happens note */}
                    <div style={{ background: "var(--purple-d)", border: "1px solid var(--purple-b)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 8 }}>
                        <span style={{ color: "var(--purple)", flexShrink: 0, fontSize: 13 }}>ℹ</span>
                        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>
                            Grants <code style={{ color: "var(--cyan)" }}>admin</code> and revokes{" "}
                            <code style={{ color: "var(--cyan)" }}>voter</code> in both the database and Keycloak.
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ background: "var(--red-d)", border: "1px solid rgba(247,111,111,.25)", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--red)" }}>{error.title ?? "Error"}</div>
                            <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3 }}>{error.message}</div>
                            {error.requestId && (
                                <div style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t3)", marginTop: 5 }}>
                                    Ref: {error.requestId}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div style={{ background: "var(--green-d)", border: "1px solid var(--green-b)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                            <CheckCircle2 size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>Admin assigned successfully!</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancel</Btn>
                    <Btn variant="primary" loading={loading} onClick={submit} disabled={success || !email.trim()}>
                        Assign Admin →
                    </Btn>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrganizationsHome() {
    const navigate = useNavigate();

    const [orgs,    setOrgs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [q, setQ]             = useState("");
    const [assignTarget, setAssignTarget] = useState(null);

    async function load() {
        setLoading(true); setError(null);
        try {
            const data = await withUnwrap(OVS.getAllOrganizations());
            setOrgs(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(toAppError(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return orgs;
        return orgs.filter(o =>
            (o.name    || "").toLowerCase().includes(s) ||
            (o.type    || "").toLowerCase().includes(s) ||
            (o.country || "").toLowerCase().includes(s) ||
            (o.allowedDomains || []).some(d => d.toLowerCase().includes(s))
        );
    }, [orgs, q]);

    return (
        <SuperAdminLayout
            breadcrumbs={[{ label: "SuperAdmin", path: "/superAdmin" }, { label: "Organizations" }]}
            topbarRight={
                <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="ghost" size="sm" onClick={load}>↻ Refresh</Btn>
                    <Btn variant="primary" size="sm" onClick={() => navigate("/superadmin/orgs/create")}>
                        <PlusCircle size={12} /> Create Org
                    </Btn>
                </div>
            }
        >
            {/* Header */}
            <div style={{ animation: "fadeUp .28s both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Building2 size={15} style={{ color: "var(--cyan)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--t3)" }}>SuperAdmin · Organizations</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>
                    Organization Management
                </h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    Search orgs and click <strong style={{ color: "var(--t2)" }}>Assign Admin</strong> on any row.
                </p>
            </div>

            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, animation: "fadeUp .28s .06s both" }}>
                {[
                    { label: "Total Orgs",     value: orgs.length,                                        color: "var(--cyan)"   },
                    { label: "Total Domains",  value: orgs.flatMap(o => o.allowedDomains ?? []).length,   color: "var(--purple)" },
                    { label: "Showing",        value: filtered.length,                                     color: "var(--green)"  },
                ].map(k => (
                    <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 4 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, maxWidth: 440, animation: "fadeUp .28s .09s both" }}>
                <Search size={14} style={{ color: "var(--t3)", flexShrink: 0 }} />
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search name, @domain, type, country…"
                    style={{ background: "transparent", border: "none", color: "var(--t1)", fontSize: 13, fontFamily: "Inter", outline: "none", flex: 1 }}
                />
                {q && (
                    <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer" }}>
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: "var(--red-d)", border: "1px solid rgba(247,111,111,.25)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--red)" }}>{error.title ?? "Failed to load"}</div>
                    <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3 }}>{error.message}</div>
                </div>
            )}

            {/* Table */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", animation: "fadeUp .28s .12s both" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>Organizations</div>
                    <div style={{ fontSize: 11, color: "var(--t3)" }}>{filtered.length} of {orgs.length}</div>
                </div>

                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "40px 0", color: "var(--t2)" }}>
                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        <span style={{ fontSize: 13 }}>Loading…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ fontSize: 32, opacity: .3, marginBottom: 10 }}>🏢</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)" }}>
                            {q ? "No organizations match your search" : "No organizations yet"}
                        </div>
                        {!q && (
                            <button
                                onClick={() => navigate("/superadmin/orgs/create")}
                                style={{ marginTop: 12, background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "Inter" }}
                            >
                                + Create the first one
                            </button>
                        )}
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr>
                            {["Organization", "Allowed Domains", "Type", "Country", "Actions"].map(h => (
                                <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((org, i) => (
                            <tr
                                key={org.id}
                                style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background .12s" }}
                                onMouseEnter={ev => ev.currentTarget.style.background = "rgba(255,255,255,.02)"}
                                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                            >
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ fontWeight: 600, color: "var(--t1)", fontSize: 13 }}>{org.name || "—"}</div>
                                    <div style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t3)", marginTop: 2 }}>
                                        {String(org.id || "").slice(0, 8)}…
                                    </div>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                        {(org.allowedDomains || []).map(d => (
                                            <span key={d} style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", padding: "2px 8px", borderRadius: 20, background: "var(--cyan-d)", color: "var(--cyan)", border: "1px solid rgba(77,217,232,.15)" }}>
                          @{d}
                        </span>
                                        ))}
                                        {(!org.allowedDomains || !org.allowedDomains.length) && (
                                            <span style={{ fontSize: 11, color: "var(--t3)" }}>—</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--t2)" }}>{org.type || "—"}</td>
                                <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--t2)" }}>{org.country || "—"}</td>
                                <td style={{ padding: "12px 16px" }}>
                                    <Btn variant="cyan" size="sm" onClick={() => setAssignTarget(org)}>
                                        Assign Admin
                                    </Btn>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {assignTarget && (
                <AssignAdminModal
                    org={assignTarget}
                    onClose={() => setAssignTarget(null)}
                    onSuccess={load}
                />
            )}

            <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>
        </SuperAdminLayout>
    );
}
