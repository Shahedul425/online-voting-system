/*
 * Endpoint: OVS.getVoterListByElection({ electionId })
 *           → GET /admin/election/VoterListByElection/{electionId}
 * Response: List<VoterListModel> { id, voterId, email, electionId, hasVoted? }
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { EmptyState, Btn } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function AdminVoterList() {
  const { id: electionId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | voted | notVoted

  useEffect(() => {
    setLoading(true);
    withUnwrap(OVS.getVoterListByElection({ electionId }))
      .then(d => setRows(d || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [electionId]);

  const filtered = useMemo(() => rows
    .filter(r => filter === "all" ? true : filter === "voted" ? r.hasVoted : !r.hasVoted)
    .filter(r => !q ||
      (r.voterId || "").toLowerCase().includes(q.toLowerCase()) ||
      (r.email   || "").toLowerCase().includes(q.toLowerCase())
    ), [rows, q, filter]);

  const voted = rows.filter(r => r.hasVoted).length;

  const exportCsv = () => {
    const header = "voter_id,email,has_voted\n";
    const body = rows.map(r => `${r.voterId || ""},${r.email || ""},${r.hasVoted?"true":"false"}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `voters-${electionId.slice(0,8)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title="Voter list"
        crumbs={[{label:"Elections",path:"/admin/elections"},{label:electionId?.slice(0,8),path:`/admin/elections/${electionId}`},{label:"Voters"}]}
        right={
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={exportCsv}><Icon name="download" className="w-4 h-4" />Export CSV</Btn>
            <Link to={`/admin/elections/${electionId}/uploads/voters`} className="btn btn-primary"><Icon name="upload" className="w-4 h-4"/>Upload CSV</Link>
          </div>
        }
      />
      <Scaffold>
        <div className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 surface-2 rounded-lg flex-1 min-w-[220px]">
            <Icon name="search" className="w-4 h-4 ink-3" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search voter-id or email…" className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <div className="flex gap-1 surface-2 p-1 rounded-lg">
            {[["all","All"],["voted","Voted"],["notVoted","Not voted"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-md text-xs font-medium ${filter===k?"surface font-semibold":"ink-2"}`}>{l}</button>
            ))}
          </div>
          <div className="text-xs ink-3 ml-2">{voted}/{rows.length} cast</div>
        </div>

        {loading
          ? <div className="card p-8 text-center ink-3 text-sm">Loading…</div>
          : filtered.length === 0
            ? <EmptyState icon="users" title="No voters match" body="Try a different filter, or upload a voter roll CSV." />
            : <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="surface-2 text-xs ink-3 uppercase tracking-widest">
                      <th className="px-4 py-2.5 text-left">Voter ID</th>
                      <th className="px-4 py-2.5 text-left">Email</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id || r.voterId} className="border-t hairline">
                        <td className="px-4 py-2.5 mono text-xs">{r.voterId}</td>
                        <td className="px-4 py-2.5 ink-2">{r.email || "—"}</td>
                        <td className="px-4 py-2.5">
                          {r.hasVoted
                            ? <span className="chip" style={{ background: "rgba(232,93,117,0.12)", color: "var(--coral)" }}><Icon name="check" className="w-3 h-3"/>Cast</span>
                            : <span className="chip surface-2"><Icon name="circle" className="w-3 h-3"/>Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </Scaffold>
    </AppShell>
  );
}
