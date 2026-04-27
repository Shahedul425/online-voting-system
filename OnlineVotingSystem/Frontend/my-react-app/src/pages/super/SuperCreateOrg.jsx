/*
 * SuperCreateOrg — register a new tenant.
 *
 * Backend contract (DAO/OrganizationRequest):
 *   {
 *     name:          NotBlank, max 200,
 *     type:          NotBlank, max 50,
 *     allowedDomains: NotEmpty<List<String>> (each NotBlank, max 253),
 *     country:       NotBlank, max 100,
 *   }
 *
 * The server validates each domain (no http://, no paths, must contain a dot)
 * and rejects DOMAIN_ALREADY_ASSIGNED if it collides with another tenant. We
 * mirror the same validation client-side so the user gets feedback before
 * the round-trip.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

const ORG_TYPES = [
  { value: "university",  label: "University"  },
  { value: "company",     label: "Company"     },
  { value: "union",       label: "Union"       },
  { value: "association", label: "Association" },
  { value: "government",  label: "Government"  },
  { value: "ngo",         label: "NGO"         },
  { value: "other",       label: "Other"       },
];

function normaliseDomain(raw) {
  if (!raw) return "";
  let d = String(raw).trim().toLowerCase();
  if (d.startsWith("@")) d = d.slice(1);
  return d;
}

function validateDomain(d) {
  if (!d) return "Domain cannot be blank";
  if (d.includes("://") || d.includes("/") || d.includes(" ")) {
    return "Use the bare domain (e.g. example.com) — no http://, no paths.";
  }
  if (!d.includes(".")) return "Domain must contain a dot, e.g. example.com";
  if (d.length > 253) return "Domain is too long";
  return null;
}

export default function SuperCreateOrg() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    type: "university",
    country: "",
    domains: [],            // list of normalised strings
  });
  const [domainInput, setDomainInput] = useState("");
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");
  const [created, setCreated] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addDomain = () => {
    const next = normaliseDomain(domainInput);
    if (!next) return;
    const reason = validateDomain(next);
    if (reason) { setError(reason); return; }
    if (form.domains.includes(next)) { setError(`@${next} is already in the list.`); return; }
    setForm(f => ({ ...f, domains: [...f.domains, next] }));
    setDomainInput("");
    setError("");
  };

  const removeDomain = (d) => {
    setForm(f => ({ ...f, domains: f.domains.filter(x => x !== d) }));
  };

  const onDomainKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addDomain();
    } else if (e.key === "Backspace" && !domainInput && form.domains.length) {
      // pop last chip on backspace
      setForm(f => ({ ...f, domains: f.domains.slice(0, -1) }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    // Roll any half-typed domain into the list before submit
    let domains = form.domains;
    if (domainInput.trim()) {
      const next = normaliseDomain(domainInput);
      const reason = validateDomain(next);
      if (reason) { setError(reason); return; }
      if (!domains.includes(next)) domains = [...domains, next];
    }

    if (!form.name.trim())    { setError("Organization name is required."); return; }
    if (!form.type.trim())    { setError("Pick an organisation type.");     return; }
    if (!form.country.trim()) { setError("Country is required.");           return; }
    if (domains.length === 0) { setError("Add at least one allowed sign-up domain."); return; }

    setError(""); setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type.trim(),
        country: form.country.trim(),
        allowedDomains: domains,
      };
      const resp = await withUnwrap(OVS.createOrganization(payload));
      // Backend returns either the saved entity or a string message — handle both.
      setCreated(typeof resp === "object" && resp ? { ...payload, ...resp } : { ...payload });
    } catch (err) {
      setError(err?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell role="superadmin" active="/superadmin/orgs">
      <Topbar
        title="Create organization"
        crumbs={[{ label: "Organizations", path: "/superadmin/orgs" }, { label: "Create" }]}
      />
      <Scaffold>
        <div className="max-w-2xl mx-auto">
          {created ? (
            <div className="card p-6">
              <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center mb-3">
                <Icon name="check-circle-2" className="w-6 h-6" />
              </div>
              <div className="display text-xl font-semibold mb-1">Organization created</div>
              <div className="ink-2 text-sm mb-4">
                <span className="mono">{created.name}</span> is registered for{" "}
                <strong>{created.country}</strong> with{" "}
                <strong>{(created.allowedDomains || []).length}</strong>{" "}
                {(created.allowedDomains || []).length === 1 ? "domain" : "domains"}.
                Next: assign an admin so they can run elections.
              </div>
              <div className="flex gap-2 flex-wrap">
                <Btn
                  variant="primary"
                  onClick={() => nav("/superadmin/admins", { state: { orgId: created.id, orgName: created.name } })}
                >
                  <Icon name="shield" className="w-4 h-4" /> Assign admin
                </Btn>
                <Btn variant="ghost" onClick={() => nav("/superadmin/orgs")}>
                  Back to organizations
                </Btn>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center shrink-0">
                  <Icon name="building-2" className="w-6 h-6" />
                </div>
                <div>
                  <div className="display text-lg font-semibold mb-1">New tenant</div>
                  <p className="ink-2 text-sm">
                    A tenant is a single organisation — a company, a university, a union — that
                    owns its own elections and admins. Members are routed to the tenant by
                    matching the email domain they sign up with against the list below.
                  </p>
                </div>
              </div>

              <Field
                label="Organisation name"
                value={form.name}
                onChange={v => set("name", v)}
                placeholder="e.g. BRAC University"
                autoFocus
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectField
                  label="Type"
                  value={form.type}
                  onChange={v => set("type", v)}
                  options={ORG_TYPES}
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={v => set("country", v)}
                  placeholder="e.g. Bangladesh"
                />
              </div>

              <DomainChipsField
                label="Allowed sign-up domains"
                hint="Anyone whose email ends with one of these will be auto-routed to this tenant. Press Enter, comma, or space to add."
                domains={form.domains}
                inputValue={domainInput}
                onInputChange={setDomainInput}
                onAdd={addDomain}
                onRemove={removeDomain}
                onKeyDown={onDomainKeyDown}
              />

              {error && (
                <div
                  className="text-sm p-2 rounded-lg"
                  style={{ color: "var(--err, #c14545)", background: "rgba(193,69,69,0.08)" }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Btn variant="primary" type="submit" disabled={busy}>
                  <Icon name={busy ? "loader-2" : "plus-circle"} className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
                  {busy ? "Creating…" : "Create organization"}
                </Btn>
                <Btn variant="ghost" type="button" onClick={() => nav("/superadmin/orgs")}>
                  Cancel
                </Btn>
              </div>
            </form>
          )}
        </div>
      </Scaffold>
    </AppShell>
  );
}

function fieldClass() {
  return "px-3 py-2.5 rounded-lg surface-2 text-sm w-full outline-none";
}
function fieldStyle() {
  return { border: "1px solid var(--hairline)", color: "var(--t1)" };
}

function Field({ label, value, onChange, placeholder, autoFocus }) {
  return (
    <label className="block">
      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={fieldClass()}
        style={fieldStyle()}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={fieldClass()}
        style={fieldStyle()}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function DomainChipsField({ label, hint, domains, inputValue, onInputChange, onAdd, onRemove, onKeyDown }) {
  return (
    <label className="block">
      <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">{label}</div>
      <div
        className="flex flex-wrap items-center gap-1.5 px-2 py-2 rounded-lg surface-2 min-h-[44px]"
        style={fieldStyle()}
      >
        {domains.map(d => (
          <span
            key={d}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md mono text-[12px]"
            style={{
              background: "rgba(232, 124, 102, 0.10)",
              color: "var(--coral)",
              border: "1px solid rgba(232, 124, 102, 0.20)",
            }}
          >
            @{d}
            <button
              type="button"
              onClick={() => onRemove(d)}
              className="ml-0.5 opacity-70 hover:opacity-100"
              aria-label={`Remove ${d}`}
            >
              <Icon name="x" className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => inputValue.trim() && onAdd()}
          placeholder={domains.length === 0 ? "example.com, brac.ac.bd…" : ""}
          className="bg-transparent text-sm outline-none flex-1 min-w-[140px] px-1"
          style={{ color: "var(--t1)" }}
        />
      </div>
      <div className="text-[11px] ink-3 mt-1">{hint}</div>
    </label>
  );
}
