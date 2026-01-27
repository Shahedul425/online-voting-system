"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCheck, Loader2, Search } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import {useParams} from "react-router-dom";

export default function AdminCandidateList() {
    const { election } = useAppStore();
    // const electionId = election?.id || election;
    const {electionId} = useParams();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [q, setQ] = useState(""); // search candidate name/party/position

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((c) => {
            const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim().toLowerCase();
            const party = (c.party || "").toLowerCase();
            const position = (c.position || "").toLowerCase();
            const serial = `${c.ballotSerial ?? ""}`.toLowerCase();
            return name.includes(s) || party.includes(s) || position.includes(s) || serial.includes(s);
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
            const res = await OVS.getCandidates({ electionId });
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
                            <UserCheck className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm text-white/80">Admin • Candidate List</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Candidates</h1>
                        <p className="mt-2 text-sm text-white/60">
                            Election: {election?.name ? election.name : electionId || "—"}
                        </p>
                    </div>

                    <div className="w-full sm:w-80">
                        <label className="text-xs text-white/60">Search name / party / position</label>
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <Search className="h-4 w-4 text-white/50" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="e.g. President, Unity, 101"
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
                            Loading candidates...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-white/60">No candidates found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((c) => {
                                const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Candidate";
                                const img = c.photoUrl || null;
                                return (
                                    <div
                                        key={c.id}
                                        className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40"
                                    >
                                        <div className="h-36 bg-zinc-950/40">
                                            {img ? (
                                                <img
                                                    src={img}
                                                    alt={fullName}
                                                    className="h-36 w-full object-cover opacity-90"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                            ) : (
                                                <div className="flex h-36 items-center justify-center text-xs text-white/40">
                                                    No photo
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="text-base font-semibold text-white/90">{fullName}</div>
                                            <div className="mt-1 text-sm text-white/60">{c.party || "Independent"}</div>
                                            <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                                                <span>{c.position || "—"}</span>
                                                <span className="font-mono">#{c.ballotSerial ?? "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
