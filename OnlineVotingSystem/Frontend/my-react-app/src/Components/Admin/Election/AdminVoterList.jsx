"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Loader2, Search } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import {useParams} from "react-router-dom";

export default function AdminVoterList() {
    const { election } = useAppStore();
    // const electionId = election?.id || election;
    const {electionId} = useParams();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [q, setQ] = useState(""); // search by voterId/email
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((r) => {
            const voterId = (r.voterId || "").toLowerCase();
            const email = (r.email || "").toLowerCase();
            return voterId.includes(s) || email.includes(s);
        });
    }, [rows, q]);

    useEffect(() => {
        let alive = true;

        async function load() {
            setError(null);

            if (!electionId) {
                setLoading(false);
                setError(
                    toAppError({
                        status: 400,
                        code: "NO_ELECTION",
                        message: "No election selected. Please select an election first.",
                    })
                );
                return;
            }

            setLoading(true);
            const res = await OVS.getVoterListByElection({ electionId }); // ✅ expects endpoint wrapper
            if (!alive) return;

            setLoading(false);

            if (!res.ok) {
                setError(toAppError(res));
                return;
            }

            setRows(Array.isArray(res.data) ? res.data : []);
        }

        load();
        return () => {
            alive = false;
        };
    }, [electionId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                            <Users className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Admin • Voter List</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Voters</h1>
                        <p className="mt-2 text-sm text-white/60">
                            Election: {election?.name ? election.name : electionId || "—"}
                        </p>
                    </div>

                    <div className="w-full sm:w-80">
                        <label className="text-xs text-white/60">Search voterId or email</label>
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <Search className="h-4 w-4 text-white/50" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="e.g. LSBU-1001 or john@lsbu.ac.uk"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-white/70">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading voters...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-white/60">No voters found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-white/50">
                                <tr className="border-b border-white/10">
                                    <th className="py-3 pr-4">Voter ID</th>
                                    <th className="py-3 pr-4">Email</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 pr-4">Voted At</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                {filtered.map((r) => (
                                    <tr key={r.id} className="hover:bg-white/5">
                                        <td className="py-3 pr-4 font-mono text-xs text-white/80">{r.voterId}</td>
                                        <td className="py-3 pr-4 text-white/80">{r.email}</td>
                                        <td className="py-3 pr-4">
                        <span
                            className={[
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                r.blocked
                                    ? "bg-red-500/10 text-red-200 border border-red-500/20"
                                    : r.hasVoted
                                        ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20"
                                        : "bg-white/5 text-white/70 border border-white/10",
                            ].join(" ")}
                        >
                          {r.blocked ? "Blocked" : r.hasVoted ? "Voted" : "Eligible"}
                        </span>
                                        </td>
                                        <td className="py-3 pr-4 text-white/70">
                                            {r.votedAt ? new Date(r.votedAt).toLocaleString() : "—"}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
