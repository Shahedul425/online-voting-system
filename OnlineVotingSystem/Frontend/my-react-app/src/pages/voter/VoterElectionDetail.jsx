/*
 * Endpoints used:
 *   OVS.getVoterElectionById({ id })       — GET /voter/election/ElectionById/{id}
 *   OVS.getVoterCandidates({ electionId }) — GET /voter/election/AllCandidate/{electionId}
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { fmtDateTime } from "../../lib/format";

export default function VoterElectionDetail() {
  const { id } = useParams();
  const [el, setEl] = useState(null);
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      withUnwrap(OVS.getVoterElectionById({ id })).catch(() => null),
      withUnwrap(OVS.getVoterCandidates({ electionId: id })).catch(() => []),
    ]).then(([e, c]) => {
      setEl(e); setCands(c || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppShell role="voter" active="/voter/elections"><Scaffold><div className="ink-3 text-sm">Loading…</div></Scaffold></AppShell>;
  if (!el)     return <AppShell role="voter" active="/voter/elections"><Topbar title="Not found" /><Scaffold><div className="ink-2">This election could not be loaded.</div></Scaffold></AppShell>;

  const canVote = el.status === "running";
  const byPosition = groupBy(cands, c => c.position);

  return (
    <AppShell role="voter" active="/voter/elections">
      <Topbar
        title={el.name}
        crumbs={[{ label: "Elections", path: "/voter/elections" }, { label: el.name }]}
        right={<StatusPill status={el.status} />}
      />
      <Scaffold>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <InfoCard icon="calendar" label="Starts"   value={fmtDateTime(el.startTime)} />
          <InfoCard icon="clock"    label="Closes"   value={fmtDateTime(el.endTime)} />
          <InfoCard icon="users"    label="Eligible" value={(el.totalVoters || 0).toLocaleString()} />
        </div>

        {canVote && (
          <div className="card p-5 mb-6 grad-soft flex items-center gap-4">
            <Icon name="vote" className="w-6 h-6 coral shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Voting is open — cast your ballot</div>
              <div className="text-xs ink-2">You'll verify with a 6-digit email code before submitting.</div>
            </div>
            <Link to={`/voter/ballot/${el.id}`} className="btn btn-primary"><Icon name="vote" className="w-4 h-4" /> Cast my ballot</Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="display text-lg font-semibold">Candidates ({cands.length})</div>
        </div>

        {Object.entries(byPosition).map(([pos, list]) => (
          <section key={pos} className="mb-6">
            <div className="text-xs ink-3 uppercase tracking-widest mb-2">{pos}</div>
            <div className="grid md:grid-cols-2 gap-3">
              {list.map(c => (
                <div key={c.id} className="card p-4 flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl grad-soft coral flex items-center justify-center font-semibold shrink-0">
                    {(c.firstName?.[0] || "") + (c.lastName?.[0] || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.firstName} {c.lastName}</div>
                    {c.ballotSerial && <div className="tag text-[10px]">{c.ballotSerial}</div>}
                    {c.manifesto && <div className="text-xs ink-2 mt-1.5 leading-relaxed">{c.manifesto}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </Scaffold>
    </AppShell>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon} className="w-4 h-4 ink-3" />
        <div className="text-xs ink-3 uppercase tracking-widest">{label}</div>
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function groupBy(arr, keyFn) {
  return (arr || []).reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
}
