/*
 * Endpoint: OVS.getCandidates({ electionId })
 *           → GET /admin/election/AllCandidate/{electionId}
 * Response: List<CandidateListModel> { id, fullName, position, ballotSerial, photoUrl? }
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { EmptyState } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function AdminCandidateList() {
  const { id: electionId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    withUnwrap(OVS.getCandidates({ electionId }))
      .then(d => setRows(d || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [electionId]);

  const byPosition = useMemo(() => {
    const filtered = rows.filter(r => !q ||
      (r.fullName     || "").toLowerCase().includes(q.toLowerCase()) ||
      (r.ballotSerial || "").toLowerCase().includes(q.toLowerCase()) ||
      (r.position     || "").toLowerCase().includes(q.toLowerCase())
    );
    const grouped = {};
    filtered.forEach(r => {
      const k = r.position || "Unknown position";
      (grouped[k] = grouped[k] || []).push(r);
    });
    return grouped;
  }, [rows, q]);

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title="Candidate list"
        crumbs={[{label:"Elections",path:"/admin/elections"},{label:electionId?.slice(0,8),path:`/admin/elections/${electionId}`},{label:"Candidates"}]}
        right={<Link to={`/admin/elections/${electionId}/uploads/candidates`} className="btn btn-primary"><Icon name="upload" className="w-4 h-4"/>Upload CSV</Link>}
      />
      <Scaffold>
        <div className="card p-3 mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 surface-2 rounded-lg flex-1">
            <Icon name="search" className="w-4 h-4 ink-3" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search candidates, positions, ballot serials…" className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <div className="text-xs ink-3 ml-2">{rows.length} total</div>
        </div>

        {loading
          ? <div className="card p-8 text-center ink-3 text-sm">Loading…</div>
          : Object.keys(byPosition).length === 0
            ? <EmptyState icon="user-round" title="No candidates yet" body="Upload a CSV to populate the ballot." />
            : <div className="space-y-4">
                {Object.entries(byPosition).map(([position, list]) => (
                  <div key={position} className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="display text-base font-semibold">{position}</div>
                      <span className="chip surface-2 text-xs">{list.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {list.map(c => (
                        <div key={c.id} className="card p-3 flex items-center gap-3">
                          {c.photoUrl
                            ? <img src={c.photoUrl} alt={c.fullName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                            : <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center shrink-0 font-semibold display text-lg">{(c.fullName||"?").charAt(0)}</div>}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{c.fullName}</div>
                            <div className="text-[11px] mono ink-3">Ballot #{c.ballotSerial}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
        }
      </Scaffold>
    </AppShell>
  );
}
