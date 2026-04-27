/*
 * Endpoint: OVS.assignOrgAdmin({ email, orgId })
 *           → POST /superadmin/org/assign/admin
 *           Payload: { email, orgId } (query params, per existing backend)
 * And:      OVS.getAllOrganizations() to populate the org picker
 *
 * No /superadmin/admins/list endpoint exists yet, so this page is an assignment
 * form, not a management table. When backend gains `getOrgAdmins(orgId)`, drop
 * in the list rendering below the form.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function SuperAdmins() {
  const loc = useLocation();
  const preset = loc.state || {};
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({ email: "", orgId: preset.orgId || "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  useEffect(() => {
    withUnwrap(OVS.getAllOrganizations())
      .then(d => setOrgs(d || []))
      .catch(() => setOrgs([]));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.orgId) { setMsg({ kind: "error", text: "Both fields are required." }); return; }
    setMsg({ kind: "", text: "" }); setBusy(true);
    try {
      await withUnwrap(OVS.assignOrgAdmin({ email: form.email.trim(), orgId: form.orgId }));
      setMsg({ kind: "ok", text: `${form.email} now has admin on ${orgName(form.orgId, orgs)}.` });
      setForm(f => ({ ...f, email: "" }));
    } catch (err) {
      setMsg({ kind: "error", text: err?.message || "Assignment failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell role="superadmin" active="/superadmin/admins">
      <Topbar title="Org admins" crumbs={[{label:"Org admins"}]} />
      <Scaffold>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={submit} className="card p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center shrink-0"><Icon name="shield" className="w-6 h-6"/></div>
              <div>
                <div className="display text-lg font-semibold mb-1">Assign an admin</div>
                <p className="ink-2 text-sm">Grant the <span className="mono">admin</span> role on a specific organization. The user must already have an account — they'll be promoted on their next sign-in.</p>
              </div>
            </div>

            <label className="block">
              <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">Organization</div>
              <select value={form.orgId} onChange={e => set("orgId", e.target.value)}
                className="px-3 py-2.5 rounded-lg surface-2 text-sm w-full" style={{ border: "1px solid var(--hairline)" }}>
                <option value="">— Select an organization —</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>

            <label className="block">
              <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">User email</div>
              <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="user@example.org"
                className="px-3 py-2.5 rounded-lg surface-2 text-sm w-full mono" style={{ border: "1px solid var(--hairline)" }} />
            </label>

            {msg.text && (
              <div className="text-sm p-3 rounded-lg"
                   style={{
                     background: msg.kind === "ok" ? "rgba(232,93,117,0.08)" : "rgba(232,93,117,0.08)",
                     color: "var(--coral)",
                   }}>
                {msg.text}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Btn variant="primary" type="submit" disabled={busy}>
                <Icon name={busy?"loader-2":"user-check"} className={`w-4 h-4 ${busy?"animate-spin":""}`}/>
                {busy?"Assigning…":"Assign admin"}
              </Btn>
            </div>
          </form>

          <div className="card p-5 mt-4 surface-2">
            <div className="flex items-start gap-3">
              <Icon name="info" className="w-5 h-5 coral shrink-0 mt-0.5"/>
              <div className="text-sm ink-2">
                <div className="font-semibold text-[var(--ink-1)] mb-1">About this role</div>
                Admins can create/manage elections, upload voter + candidate lists, run live audits, and publish results — within their own organization only. They can't see other tenants' data.
              </div>
            </div>
          </div>
        </div>
      </Scaffold>
    </AppShell>
  );
}

function orgName(id, orgs) {
  return (orgs.find(o => o.id === id)?.name) || id;
}
