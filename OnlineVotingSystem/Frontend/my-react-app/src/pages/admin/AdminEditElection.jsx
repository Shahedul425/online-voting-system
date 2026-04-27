/*
 * AdminEditElection — edit name / description / time-window of a draft election.
 *
 * Backend rules (ElectionAdminService.updateElection):
 *   • Only draft elections can be updated; ELECTION_NOT_DRAFT (409) otherwise.
 *   • startTime < endTime, else INVALID_TIME_WINDOW (400).
 *   • Each field is optional — only non-null fields overwrite the existing value.
 *   • Positions are NOT updatable here (immutable after creation).
 *
 * Endpoint: OVS.updateElection({ id, payload }) — POST /admin/election/update?id=...
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

// Spring's @JsonFormat for LocalDateTime accepts ISO without the trailing Z.
// <input type="datetime-local"> gives us yyyy-MM-ddTHH:mm — perfect, just append :00.
function toLocalIsoForBackend(localValue) {
  if (!localValue) return null;
  return localValue.length === 16 ? `${localValue}:00` : localValue;
}

// Convert backend ISO → datetime-local input value (drops trailing Z and seconds).
function toInputValue(isoString) {
  if (!isoString) return "";
  // strip Z if present, then trim to 16 chars (yyyy-MM-ddTHH:mm)
  const clean = String(isoString).replace(/Z$/, "");
  return clean.slice(0, 16);
}

export default function AdminEditElection() {
  const nav = useNavigate();
  const { id } = useParams();

  const [election, setElection] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    let cancelled = false;
    withUnwrap(OVS.getElectionById({ id }))
      .then(el => {
        if (cancelled) return;
        setElection(el);
        setForm({
          name: el.name || "",
          description: el.description || "",
          startTime: toInputValue(el.startTime),
          endTime:   toInputValue(el.endTime),
        });
      })
      .catch(e => setErr(e?.message || "Could not load election."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!form.name.trim()) {
      setErr("Election name is required.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setErr("Both start and end times are required.");
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setErr("Start time must be before end time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        startTime: toLocalIsoForBackend(form.startTime),
        endTime:   toLocalIsoForBackend(form.endTime),
      };
      await withUnwrap(OVS.updateElection({ id, payload }));
      nav(`/admin/elections/${id}`, { replace: true });
    } catch (e) {
      setErr(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="admin" active="/admin/elections">
        <Scaffold><div className="ink-3 text-sm">Loading…</div></Scaffold>
      </AppShell>
    );
  }

  if (!election) {
    return (
      <AppShell role="admin" active="/admin/elections">
        <Scaffold>
          <div className="card p-8 text-center">
            <Icon name="alert-triangle" className="w-10 h-10 coral mx-auto mb-3" />
            <div className="display text-lg font-semibold mb-1">Election not found</div>
            <p className="text-sm ink-2 mb-4">{err || "We couldn't load that election."}</p>
            <Link to="/admin/elections" className="btn btn-primary">
              <Icon name="arrow-left" className="w-4 h-4" /> Back to elections
            </Link>
          </div>
        </Scaffold>
      </AppShell>
    );
  }

  const status = (election.status || "").toLowerCase();
  const isDraft = status === "draft";

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title={`Edit · ${election.name}`}
        crumbs={[
          { label: "Elections", path: "/admin/elections" },
          { label: election.name, path: `/admin/elections/${id}` },
          { label: "Edit" },
        ]}
        right={<StatusPill status={election.status} />}
      />
      <Scaffold>
        {!isDraft && (
          <div
            className="card p-4 mb-4"
            style={{
              background: "rgba(255,170,80,0.08)",
              borderColor: "rgba(255,170,80,0.30)",
            }}
          >
            <div className="flex items-start gap-3">
              <Icon name="lock" className="w-5 h-5 shrink-0" style={{ color: "#C97A2B" }} />
              <div>
                <div className="font-semibold mb-1" style={{ color: "var(--t1)" }}>
                  This election can no longer be edited
                </div>
                <p className="text-sm ink-2">
                  Only <strong>draft</strong> elections can have their name, description or
                  time window changed. This one is currently <strong>{election.status}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="max-w-2xl card p-6 space-y-4">
          <Field
            label="Election name"
            value={form.name}
            onChange={v => set("name", v)}
            disabled={!isDraft}
          />
          <label className="block">
            <div className="text-xs ink-3 uppercase tracking-widest mb-1.5">Description</div>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              disabled={!isDraft}
              className="w-full px-3 py-2.5 rounded-xl surface-2 text-sm outline-none"
              style={{ border: "1px solid var(--hairline)", color: "var(--t1)" }}
            />
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Starts at (UTC)"
              type="datetime-local"
              value={form.startTime}
              onChange={v => set("startTime", v)}
              disabled={!isDraft}
            />
            <Field
              label="Ends at (UTC)"
              type="datetime-local"
              value={form.endTime}
              onChange={v => set("endTime", v)}
              disabled={!isDraft}
            />
          </div>
          <div className="text-[11px] ink-3">
            Positions can&apos;t be edited after creation. To change positions, create a new
            election.
          </div>

          {err && (
            <div
              className="text-xs p-2 rounded-lg"
              style={{ color: "var(--err)", background: "rgba(193,69,69,0.08)" }}
            >
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Btn variant="ghost" type="button" onClick={() => nav(`/admin/elections/${id}`)}>
              <Icon name="arrow-left" className="w-4 h-4" /> Cancel
            </Btn>
            <Btn variant="primary" type="submit" disabled={!isDraft || saving}>
              <Icon name={saving ? "loader-2" : "check"} className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving…" : "Save changes"}
            </Btn>
          </div>
        </form>
      </Scaffold>
    </AppShell>
  );
}

function Field({ label, type = "text", value, onChange, disabled = false }) {
  return (
    <label className="block">
      <div className="text-xs ink-3 uppercase tracking-widest mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 rounded-xl surface-2 text-sm outline-none"
        style={{
          border: "1px solid var(--hairline)",
          color: "var(--t1)",
          opacity: disabled ? 0.65 : 1,
        }}
      />
    </label>
  );
}
