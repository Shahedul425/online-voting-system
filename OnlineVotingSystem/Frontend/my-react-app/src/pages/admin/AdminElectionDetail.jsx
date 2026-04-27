/*
 * AdminElectionDetail — election workspace.
 *
 * The Overview tab now hosts a step-by-step workflow panel that walks the
 * admin through the election lifecycle:
 *
 *    1. Upload voter list      (any state, but locked once running/closed)
 *    2. Upload candidate list  (any state, but locked once running/closed)
 *    3. Start election         (only available in draft + both lists ready)
 *    4. Close election         (only available while running)
 *    5. Publish results        (only available once closed)
 *
 * Each step shows a green check if done, a coral "do this next" hint if it's
 * the active step, and is greyed-out + disabled if it's not unlocked yet.
 *
 * Edits to the election itself are only permitted while in `draft` — once the
 * roll is locked in and the polls open, the admin is no longer allowed to
 * change titles, schedule, etc.
 *
 * Endpoints:
 *   OVS.getElectionById, getVoterListByElection, getCandidates,
 *   startElection, closeElection, publishElection
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, ConfirmModal, ErrorBanner, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";

// Tone + copy + icon for each lifecycle action — lets the same modal be
// reused without the parent caring about which transition it is.
const ACTION_DETAILS = {
  Start: {
    title: "Start this election?",
    message: "Voters will be able to request their one-time tokens and cast ballots immediately. You can still close the polls early if you need to.",
    confirmLabel: "Yes, start election",
    icon: "play",
    tone: "primary",
  },
  Close: {
    title: "Close this election?",
    message: "Token issuance halts and the running tally is sealed. New ballots will be rejected from this point on. This cannot be undone.",
    confirmLabel: "Yes, close polls",
    icon: "lock",
    tone: "navy",
  },
  Publish: {
    title: "Publish results?",
    message: "Final results are made public, the Merkle root is anchored, and the audit bundle is frozen. This cannot be undone.",
    confirmLabel: "Yes, publish results",
    icon: "trophy",
    tone: "primary",
  },
};

export default function AdminElectionDetail() {
  const { id } = useParams();
  const [el, setEl] = useState(null);
  const [voters, setVoters] = useState([]);
  const [cands, setCands] = useState([]);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState(null);
  // pendingAction = { fn, label } when we're waiting on the user to confirm.
  const [pendingAction, setPendingAction] = useState(null);

  const reload = () => withUnwrap(OVS.getElectionById({ id })).then(setEl).catch(() => {});

  useEffect(() => {
    reload();
    withUnwrap(OVS.getVoterListByElection({ electionId: id })).then(d => setVoters(d || [])).catch(() => {});
    withUnwrap(OVS.getCandidates({ electionId: id })).then(d => setCands(d || [])).catch(() => {});
  }, [id]);

  // First step: show the confirm modal. The actual call happens in `runAction`.
  const requestAction = (fn, label) => {
    setActionErr(null);
    setPendingAction({ fn, label });
  };

  const runAction = async () => {
    if (!pendingAction) return;
    const { fn } = pendingAction;
    setBusy(true);
    try {
      await withUnwrap(fn({ id }));
      setPendingAction(null);
      reload();
    } catch (e) {
      setActionErr(e?.message || "Action failed");
      setPendingAction(null);
    } finally {
      setBusy(false);
    }
  };

  if (!el) {
    return (
      <AppShell role="admin" active="/admin/elections">
        <Scaffold><div className="ink-3 text-sm">Loading…</div></Scaffold>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title={el.name}
        crumbs={[{ label: "Elections", path: "/admin/elections" }, { label: el.name }]}
        right={
          <div className="flex items-center gap-2">
            <StatusPill status={el.status} />
            {el.status === "draft" && (
              <Link to={`/admin/elections/${id}/edit`} className="btn btn-ghost">
                <Icon name="pencil" className="w-4 h-4" /> Edit
              </Link>
            )}
          </div>
        }
      />
      <Scaffold>
        <div className="grid md:grid-cols-4 gap-4 mb-5">
          <Kpi icon="users"        label="Voters"     value={voters.length} />
          <Kpi icon="user-round"   label="Candidates" value={cands.length} />
          <Kpi icon="file-check-2" label="Ballots"    value={el.votedCount || 0} />
          <Kpi icon="calendar"     label="Closes"     value={fmtDateTime(el.endTime)} small />
        </div>

        <div className="flex items-center gap-1 surface-2 p-1 rounded-lg mb-5 w-fit flex-wrap">
          {[
            ["overview",   "Overview",     "layout-dashboard"],
            ["voters",     "Voters",       "users"],
            ["candidates", "Candidates",   "user-round"],
            ["live",       "Live turnout", "activity"],
            ["results",    "Results",      "trophy"],
            ["audit",      "Audit",        "scroll-text"],
          ].map(([k, l, ic]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 ${
                tab === k ? "surface font-semibold" : "ink-2"
              }`}
            >
              <Icon name={ic} className="w-3.5 h-3.5" />{l}
            </button>
          ))}
        </div>

        {actionErr && (
          <div className="mb-4">
            <ErrorBanner
              message={actionErr}
              onClose={() => setActionErr(null)}
            />
          </div>
        )}

        {tab === "overview" && (
          <Overview
            el={el}
            id={id}
            voters={voters}
            cands={cands}
            busy={busy}
            onStart={() => requestAction(OVS.startElection, "Start")}
            onClose={() => requestAction(OVS.closeElection, "Close")}
            onPublish={() => requestAction(OVS.publishElection, "Publish")}
          />
        )}
        {tab === "voters"     && <VoterMini     rows={voters} id={id} status={el.status} />}
        {tab === "candidates" && <CandidateMini rows={cands}  id={id} status={el.status} />}
        {tab === "live"       && <LiveLink      id={id} status={el.status} />}
        {tab === "results"    && <ResultsLink   id={id} status={el.status} />}
        {tab === "audit"      && <AuditLink     id={id} />}
      </Scaffold>

      <ConfirmModal
        open={!!pendingAction}
        busy={busy}
        title={pendingAction ? ACTION_DETAILS[pendingAction.label]?.title : ""}
        message={pendingAction ? ACTION_DETAILS[pendingAction.label]?.message : ""}
        confirmLabel={pendingAction ? ACTION_DETAILS[pendingAction.label]?.confirmLabel : "Confirm"}
        icon={pendingAction ? ACTION_DETAILS[pendingAction.label]?.icon : undefined}
        tone={pendingAction ? ACTION_DETAILS[pendingAction.label]?.tone : "primary"}
        onCancel={() => !busy && setPendingAction(null)}
        onConfirm={runAction}
      />
    </AppShell>
  );
}

/* ───────────────────────── Overview / workflow ─────────────────────── */

function Overview({ el, id, voters, cands, busy, onStart, onClose, onPublish }) {
  const status = (el.status || "").toLowerCase();
  const votersDone = voters.length > 0 || el.isVoterListUploaded;
  const candsDone  = cands.length  > 0 || el.isCandidateListUploaded;

  // Compute step states. order: 1 voters, 2 candidates, 3 start, 4 close, 5 publish.
  const steps = useMemo(() => [
    {
      n: 1,
      title: "Upload voter list",
      body: "Import the eligible voters by CSV. Voters can only authenticate if they're on this list.",
      done: votersDone,
      // editable while not yet running
      action: status === "draft" ? {
        kind: "link",
        to: `/admin/elections/${id}/uploads/voters`,
        icon: "upload",
        label: votersDone ? "Re-upload" : "Upload voters",
      } : null,
      meta: votersDone ? `${voters.length} voters loaded` : "Not uploaded yet",
      lockedReason: status !== "draft" && !votersDone
        ? "Voter list cannot be uploaded after the election has started."
        : null,
    },
    {
      n: 2,
      title: "Upload candidate list",
      body: "Add candidates and the position they're standing for. Voters will see them on the ballot.",
      done: candsDone,
      action: status === "draft" ? {
        kind: "link",
        to: `/admin/elections/${id}/uploads/candidates`,
        icon: "upload",
        label: candsDone ? "Re-upload" : "Upload candidates",
      } : null,
      meta: candsDone ? `${cands.length} candidates loaded` : "Not uploaded yet",
      lockedReason: status !== "draft" && !candsDone
        ? "Candidate list cannot be uploaded after the election has started."
        : null,
    },
    {
      n: 3,
      title: "Start the election",
      body: "Open the polls. Voters can request their one-time tokens and cast ballots from now.",
      done: ["running", "closed", "published"].includes(status),
      active: status === "draft" && votersDone && candsDone,
      lockedReason:
        status === "draft" && (!votersDone || !candsDone)
          ? "Upload both voter and candidate lists first."
          : null,
      action: status === "draft" && votersDone && candsDone ? {
        kind: "btn",
        onClick: onStart,
        icon: "play",
        label: "Start election",
        variant: "primary",
      } : null,
    },
    {
      n: 4,
      title: "Close the polls",
      body: "Stop accepting ballots. Token issuance halts and the running tally is sealed.",
      done: ["closed", "published"].includes(status),
      active: status === "running",
      lockedReason: status === "draft" ? "Start the election first." : null,
      action: status === "running" ? {
        kind: "btn",
        onClick: onClose,
        icon: "lock",
        label: "Close election",
        variant: "navy",
      } : null,
    },
    {
      n: 5,
      title: "Publish results",
      body: "Finalise the Merkle root, freeze the audit bundle, and make results public.",
      done: status === "published",
      active: status === "closed",
      lockedReason: ["draft", "running"].includes(status)
        ? "Close the polls before publishing."
        : null,
      action: status === "closed" ? {
        kind: "btn",
        onClick: onPublish,
        icon: "trophy",
        label: "Publish results",
        variant: "primary",
      } : null,
    },
  ], [status, votersDone, candsDone, voters.length, cands.length, id, onStart, onClose, onPublish]);

  return (
    <div className="space-y-5">
      {/* The workflow panel */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="display text-lg font-semibold">Election workflow</div>
            <p className="text-xs ink-3 mt-0.5">
              Follow the steps in order. Each one unlocks the next.
            </p>
          </div>
          {status === "draft" && (
            <span className="text-[11px] ink-3 inline-flex items-center gap-1">
              <Icon name="pencil" className="w-3 h-3" /> Editable
            </span>
          )}
          {status !== "draft" && (
            <span className="text-[11px] ink-3 inline-flex items-center gap-1">
              <Icon name="lock" className="w-3 h-3" /> Locked — election in progress
            </span>
          )}
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map(s => <WorkflowStep key={s.n} step={s} busy={busy} />)}
        </ol>
      </div>

      {/* Schedule + readiness side by side, kept for at-a-glance reference */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="display text-lg font-semibold mb-3">Schedule</div>
          <Row label="Starts" value={fmtDateTime(el.startTime)} mono />
          <Row label="Ends"   value={fmtDateTime(el.endTime)}   mono />
          {el.merkleRoot && <Row label="Merkle root" value={el.merkleRoot} mono />}
        </div>
        <div className="card p-5">
          <div className="display text-lg font-semibold mb-3">Readiness</div>
          <Row label="Voter list"     value={votersDone ? `✓ ${voters.length} loaded` : "pending"} />
          <Row label="Candidate list" value={candsDone  ? `✓ ${cands.length} loaded`  : "pending"} />
          <Row label="Status"         value={status} />
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ step, busy }) {
  const { n, title, body, done, active, action, meta, lockedReason } = step;
  const tone = done ? "done" : active ? "active" : lockedReason ? "locked" : "pending";

  const circleStyle = {
    done:    { background: "rgba(38, 173, 129, 0.14)", color: "var(--green, #26AD81)" },
    active:  { background: "rgba(232, 124, 102, 0.14)", color: "var(--coral)" },
    locked:  { background: "var(--surface-2, rgba(0,0,0,0.04))", color: "var(--t3)" },
    pending: { background: "var(--surface-2, rgba(0,0,0,0.04))", color: "var(--t3)" },
  }[tone];

  return (
    <li className="flex items-start gap-3 p-3 rounded-xl"
        style={{
          border: `1px solid var(--hairline)`,
          background: tone === "active"
            ? "linear-gradient(180deg, rgba(232,124,102,0.06), rgba(232,124,102,0.02))"
            : "transparent",
        }}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm"
        style={circleStyle}
        aria-hidden
      >
        {done ? <Icon name="check" className="w-4 h-4" /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-semibold" style={{ color: "var(--t1)" }}>{title}</div>
          {done && <Tag tone="green">Done</Tag>}
          {!done && active && <Tag tone="coral">Do this next</Tag>}
          {!done && !active && lockedReason && <Tag tone="grey">Locked</Tag>}
        </div>
        <p className="text-xs ink-2 mt-0.5 leading-relaxed">{body}</p>
        {(meta || lockedReason) && (
          <p className="text-[11px] ink-3 mt-1">
            {lockedReason || meta}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {action?.kind === "link" && (
          <Link to={action.to} className="btn btn-ghost">
            <Icon name={action.icon} className="w-4 h-4" /> {action.label}
          </Link>
        )}
        {action?.kind === "btn" && (
          <Btn variant={action.variant || "primary"} onClick={action.onClick} disabled={busy}>
            <Icon name={action.icon} className="w-4 h-4" /> {action.label}
          </Btn>
        )}
      </div>
    </li>
  );
}

function Tag({ tone, children }) {
  const palette = {
    green: { background: "rgba(38, 173, 129, 0.12)", color: "var(--green, #26AD81)" },
    coral: { background: "rgba(232, 124, 102, 0.14)", color: "var(--coral)" },
    grey:  { background: "var(--surface-2, rgba(0,0,0,0.04))", color: "var(--t3)" },
  }[tone];
  return (
    <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-md"
          style={palette}>
      {children}
    </span>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b hairline last:border-0">
      <div className="text-xs ink-3 uppercase tracking-widest w-28 shrink-0">{label}</div>
      <div className={`text-sm break-all capitalize ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

/* ─────────────────────────── Tab partials ─────────────────────────── */

function VoterMini({ rows, id, status }) {
  const canEdit = status === "draft";
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="display font-semibold">Voter roll ({rows.length})</div>
        {canEdit
          ? <Link to={`/admin/elections/${id}/uploads/voters`} className="btn btn-ghost">
              <Icon name="upload" className="w-4 h-4" />Upload CSV
            </Link>
          : <span className="text-[11px] ink-3 inline-flex items-center gap-1">
              <Icon name="lock" className="w-3 h-3" /> Locked once the election starts
            </span>
        }
      </div>
      <div className="space-y-1">
        {rows.slice(0, 10).map((v, i) => (
          <div key={v.id || i} className="flex items-center gap-3 py-2 px-2 surface-2 rounded-lg text-sm">
            <Icon name="user" className="w-4 h-4 ink-3" />
            <div className="flex-1 truncate">{v.email}</div>
            <span className="tag">{v.voterId}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="ink-3 text-sm text-center py-6">No voters uploaded yet.</div>
        )}
      </div>
      {rows.length > 10 && (
        <div className="text-xs ink-3 mt-3 text-center">
          <Link to={`/admin/elections/${id}/voters`} className="coral font-medium">
            +{rows.length - 10} more — view full list →
          </Link>
        </div>
      )}
    </div>
  );
}

function CandidateMini({ rows, id, status }) {
  const canEdit = status === "draft";
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="display font-semibold">Candidates ({rows.length})</div>
        {canEdit
          ? <Link to={`/admin/elections/${id}/uploads/candidates`} className="btn btn-ghost">
              <Icon name="upload" className="w-4 h-4" />Upload CSV
            </Link>
          : <span className="text-[11px] ink-3 inline-flex items-center gap-1">
              <Icon name="lock" className="w-3 h-3" /> Locked once the election starts
            </span>
        }
      </div>
      {rows.length === 0
        ? <div className="ink-3 text-sm text-center py-6">No candidates uploaded yet.</div>
        : <div className="grid md:grid-cols-2 gap-3">
            {rows.map(c => (
              <div key={c.id} className="card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl grad-soft coral flex items-center justify-center font-semibold shrink-0">
                  {(c.firstName?.[0] || "") + (c.lastName?.[0] || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.firstName} {c.lastName}</div>
                  <div className="text-xs ink-3">{c.position}</div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

function LiveLink({ id, status }) {
  if (status !== "running")
    return <div className="card p-8 text-center ink-2">Live turnout is available once the election is running.</div>;
  return (
    <div className="card p-8 text-center">
      <Icon name="activity" className="w-10 h-10 coral mx-auto mb-3" />
      <div className="display text-lg font-semibold mb-1">Live turnout</div>
      <Link to={`/admin/elections/${id}/live`} className="btn btn-primary">
        <Icon name="arrow-right" className="w-4 h-4" />Open live dashboard
      </Link>
    </div>
  );
}

function ResultsLink({ id, status }) {
  if (!["closed", "published"].includes(status))
    return <div className="card p-8 text-center ink-2">Results appear once the election closes.</div>;
  return (
    <div className="card p-8 text-center">
      <Icon name="trophy" className="w-10 h-10 coral mx-auto mb-3" />
      <Link to={`/admin/elections/${id}/results`} className="btn btn-primary">
        <Icon name="arrow-right" className="w-4 h-4" />Open results
      </Link>
    </div>
  );
}

function AuditLink({ id }) {
  return (
    <div className="card p-8 text-center">
      <Icon name="scroll-text" className="w-10 h-10 coral mx-auto mb-3" />
      <div className="display text-lg font-semibold mb-1">Election audit log</div>
      <p className="text-sm ink-2 mb-4 max-w-md mx-auto">
        Every administrative action and ballot event for this election, with request IDs you
        can cross-reference against the metrics and traces.
      </p>
      <Link to={`/admin/elections/${id}/audit`} className="btn btn-primary">
        <Icon name="arrow-right" className="w-4 h-4" />Open audit log
      </Link>
    </div>
  );
}

function Kpi({ icon, label, value, small }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name={icon} className="w-4 h-4 coral" />
        <div className="text-[10px] ink-3 uppercase tracking-widest">{label}</div>
      </div>
      <div className={`display font-semibold ${small ? "text-sm mono" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
