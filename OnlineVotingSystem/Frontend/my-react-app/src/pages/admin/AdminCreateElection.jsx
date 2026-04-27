/*
 * AdminCreateElection — match backend ElectionRequest exactly:
 *
 *   {
 *     name:         NotBlank, max 200,
 *     description:  optional, max 2000,
 *     electionType: NotBlank, max 50,
 *     startTime:    NotNull,    LocalDateTime,
 *     endTime:      NotNull,    LocalDateTime,
 *   }
 *
 * Positions are NOT a property of the election — they're set on each candidate
 * row at upload time. So this form deliberately doesn't ask for them.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, ErrorBanner } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

const ELECTION_TYPES = [
  { value: "single_position",  label: "Single position",  hint: "One race — voters pick one winner." },
  { value: "multi_position",   label: "Multi position",   hint: "Multiple races on one ballot (President, VP, Treasurer…)." },
  { value: "referendum",       label: "Referendum",       hint: "Yes / No question — no candidates, just choices." },
  { value: "preferential",     label: "Preferential",     hint: "Ranked-choice / instant runoff." },
  { value: "other",            label: "Other",            hint: "Pick this if none of the above fit." },
];

// Vite's <input type="datetime-local"> hands us yyyy-MM-ddTHH:mm. Spring's
// LocalDateTime parser accepts that without a timezone — append :00 so we
// always submit yyyy-MM-ddTHH:mm:ss for consistency.
function toBackendLocal(localValue) {
  if (!localValue) return null;
  return localValue.length === 16 ? `${localValue}:00` : localValue;
}

export default function AdminCreateElection() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    electionType: "single_position",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!form.name.trim())         { setErr("Election name is required."); return; }
    if (!form.electionType.trim()) { setErr("Pick an election type.");      return; }
    if (!form.startTime || !form.endTime) {
      setErr("Both start and end times are required.");
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setErr("Start time must be before end time.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        electionType: form.electionType.trim(),
        startTime: toBackendLocal(form.startTime),
        endTime:   toBackendLocal(form.endTime),
      };
      const r = await withUnwrap(OVS.createElection(payload));
      nav(`/admin/elections/${r.id}`);
    } catch (e) {
      setErr(e?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const selected = ELECTION_TYPES.find(t => t.value === form.electionType);

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title="Create election"
        crumbs={[{ label: "Elections", path: "/admin/elections" }, { label: "Create" }]}
      />
      <Scaffold>
        <form onSubmit={submit} className="max-w-2xl card p-6 space-y-4">
          <Field
            label="Election name"
            value={form.name}
            onChange={v => set("name", v)}
            placeholder="e.g. LSBU Student Council 2026"
            autoFocus
            required
          />
          <label className="block">
            <div className="text-xs ink-3 uppercase tracking-widest mb-1.5">Description</div>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="Optional — what this election is for, who it covers, anything voters should know."
              className="w-full px-3 py-2.5 rounded-xl surface-2 text-sm outline-none"
              style={{ border: "1px solid var(--hairline)", color: "var(--t1)" }}
            />
          </label>

          <SelectField
            label="Election type"
            value={form.electionType}
            onChange={v => set("electionType", v)}
            options={ELECTION_TYPES}
            hint={selected?.hint}
          />

          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Starts at (UTC)"
              type="datetime-local"
              value={form.startTime}
              onChange={v => set("startTime", v)}
              required
            />
            <Field
              label="Ends at (UTC)"
              type="datetime-local"
              value={form.endTime}
              onChange={v => set("endTime", v)}
              required
            />
          </div>

          <div className="text-[11px] ink-3">
            You&apos;ll add candidates and positions on the next screen, after the election is
            created in <span className="mono">draft</span> status.
          </div>

          {err && <ErrorBanner message={err} onClose={() => setErr(null)} />}

          <div className="flex gap-3 pt-2">
            <Btn variant="ghost" type="button" onClick={() => nav("/admin/elections")}>
              <Icon name="arrow-left" className="w-4 h-4" /> Cancel
            </Btn>
            <Btn variant="primary" type="submit" disabled={loading}>
              <Icon name={loading ? "loader-2" : "check"} className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Creating…" : "Create election"}
            </Btn>
          </div>
        </form>
      </Scaffold>
    </AppShell>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, autoFocus, required }) {
  return (
    <label className="block">
      <div className="text-xs ink-3 uppercase tracking-widest mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        className="w-full px-3 py-2.5 rounded-xl surface-2 text-sm outline-none"
        style={{ border: "1px solid var(--hairline)", color: "var(--t1)" }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, hint }) {
  return (
    <label className="block">
      <div className="text-xs ink-3 uppercase tracking-widest mb-1.5">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl surface-2 text-sm outline-none"
        style={{ border: "1px solid var(--hairline)", color: "var(--t1)" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <div className="text-[11px] ink-3 mt-1">{hint}</div>}
    </label>
  );
}
