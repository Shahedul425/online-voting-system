import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OVS } from "../../Service/Api/endpoints.js";
import { useAppStore } from "../../Service/GlobalState/appStore.js";
import {VoteToken} from "../../Service/GlobalState/voteTokenStore.js";

// your voterId can be studentId like "LSBU-1001"
function normalizeVoterId(v) {
    return (v || "").trim();
}

export default function Verification() {
    const navigate = useNavigate();

    const election = useAppStore((s) => s.election); // { id, name, ... } from selection page
    const setElection = useAppStore((s) => s.setElection);

    const [voterId, setVoterId] = useState("");
    const [loading, setLoading] = useState(false);

    const [tokenResp, setTokenResp] = useState(null); // backend response
    const [error, setError] = useState(null);

    // guard: must have election selected
    useEffect(() => {
        if (!election?.id) {
            navigate("/elections", { replace: true });
        }
    }, [election, navigate]);

    const voterOk = useMemo(() => normalizeVoterId(voterId).length >= 3, [voterId]);

    async function onVerify() {
        setError(null);
        setTokenResp(null);

        if (!election?.id) {
            setError({ message: "No election selected. Please select an election first." });
            navigate("/elections", { replace: true });
            return;
        }

        const vid = normalizeVoterId(voterId);
        if (!voterOk) {
            setError({ message: "Voter ID is required (min 3 characters)." });
            return;
        }

        setLoading(true);
        const res = await OVS.verifyVoter({ voterId: vid, electionId: election.id });
        setLoading(false);

        if (!res.ok) {
            setError(res.error);
            return;
        }
        VoteToken.set({
            tokenId: res.data.tokenId,
            expiryTime: res.data.expiryTime,
        });

        // Expecting backend returns something like:
        // { tokenId: "...", expiryTime: "2026-..." , electionId: "...", ... }
        setTokenResp(res.data);

        // store token for voting page (survive refresh in same tab)
        try {
            sessionStorage.setItem("ovs_vote_token", JSON.stringify(res.data));
        } catch { /* empty */ }

        // go vote
        navigate("/vote", { replace: true });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12 text-white">
            <div className="mx-auto w-full max-w-lg">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-400" />
                        <span className="text-sm text-white/80">OVS System</span>
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Voter Verification</h1>
                    <p className="mt-2 text-white/60">
                        Enter your voter ID to receive a one-time voting token.
                    </p>
                </div>

                {/* Main Card */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                    {/* Election badge */}
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-xs text-white/60">Selected election</div>
                            <div className="mt-1 font-semibold">
                                {election?.name || "Election"}{" "}
                                <span className="ml-2 text-xs font-normal text-white/50 break-all">
                  {election?.id}
                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/select")}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                        >
                            Change
                        </button>
                    </div>

                    {/* Error UI (ApiError compatible) */}
                    {error && (
                        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold">Verification failed</div>
                            <div className="mt-1 text-white/80">{error.message || "Request failed"}</div>

                            {error.code && <div className="mt-2 text-xs text-white/60">Code: {error.code}</div>}
                            {error.requestId && (
                                <div className="mt-1 text-xs text-white/60">RequestId: {error.requestId}</div>
                            )}

                            {Array.isArray(error.details) && error.details.length > 0 && (
                                <ul className="mt-3 space-y-1 text-xs text-white/70">
                                    {error.details.map((d, i) => (
                                        <li key={i}>
                                            <span className="font-mono">{d.field}</span>: {d.issue}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-white/80">Voter ID</label>
                            <input
                                value={voterId}
                                onChange={(e) => setVoterId(e.target.value)}
                                placeholder="LSBU-1001"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 outline-none focus:border-indigo-400/60"
                            />
                            {voterId.length > 0 && !voterOk && (
                                <p className="mt-2 text-xs text-amber-300">Min 3 characters.</p>
                            )}
                        </div>

                        <button
                            onClick={onVerify}
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-400 transition disabled:opacity-60"
                        >
                            {loading ? "Verifying..." : "Verify & Get Token"}
                        </button>
                    </div>

                    {/* Optional token preview if you want to show it before redirect (not needed) */}
                    {tokenResp && (
                        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                            <div className="font-semibold text-emerald-200">✅ Verified</div>
                            <div className="mt-3 text-xs text-white/60">Token</div>
                            <div className="mt-1 font-mono text-sm break-all">{tokenResp.tokenId}</div>
                            {tokenResp.expiryTime && (
                                <>
                                    <div className="mt-4 text-xs text-white/60">Expires</div>
                                    <div className="mt-1 text-sm">
                                        {new Date(tokenResp.expiryTime).toLocaleString()}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center text-xs text-white/40">
                    Uses backend ApiError format. UI never crashes.
                </div>
            </div>
        </div>
    );
}
