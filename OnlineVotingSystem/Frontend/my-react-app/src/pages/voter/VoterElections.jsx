/*
 * Endpoint: OVS.getVoterAllActiveElections({ orgId })
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { EmptyState, StatusPill } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { useAppStore } from "../../Service/GlobalState/appStore";

export default function VoterElections() {
  const me = useAppStore(s => s.me);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!me?.organizationId) return;
    withUnwrap(OVS.getVoterAllActiveElections({ orgId: me.organizationId }))
      .then(d => setData(d || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [me]);

  const filtered = filter === "all" ? data : data.filter(e => e.status === filter);

  return (
    <AppShell role="voter" active="/voter/elections">
      <Topbar
        title="Elections"
        crumbs={[{ label: "Home", path: "/voter/dashboard" }, { label: "Elections" }]}
        right={
          <div className="flex gap-1 surface-2 p-1 rounded-lg">
            {["all","running","closed","published"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter===f?"surface font-semibold":"ink-2"}`}>
                {f}
              </button>
            ))}
          </div>
        }
      />
      <Scaffold>
        {loading ? <div className="ink-3 text-sm">Loading…</div> :
         filtered.length === 0 ? <EmptyState icon="inbox" title="No elections" body="Nothing to show for this filter." /> :
         <div className="space-y-3">
           {filtered.map(e => (
             <Link key={e.id} to={`/voter/election/${e.id}`} className="card card-hover p-5 flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl grad-soft coral flex items-center justify-center shrink-0">
                 <Icon name="vote" className="w-6 h-6" />
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-0.5">
                   <div className="font-semibold">{e.name}</div>
                   <StatusPill status={e.status} />
                 </div>
                 <div className="text-xs ink-3">{e.orgName || "—"} · {e.totalVoters || 0} eligible</div>
               </div>
               <Icon name="chevron-right" className="w-5 h-5 ink-3" />
             </Link>
           ))}
         </div>
        }
      </Scaffold>
    </AppShell>
  );
}
