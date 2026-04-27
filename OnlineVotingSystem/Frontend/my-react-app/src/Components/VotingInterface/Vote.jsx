// src/pages/voter/Vote.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { VoterShell } from "../layout/PubliceLayout";
import { Steps, Panel, ErrorBanner, Btn, Spinner, HintBox } from "../ui";

const STEPS = ["Select Election", "Verify ID", "Cast Ballot", "Confirm"];

function groupByPosition(candidates = []) {
    const map = new Map();
    for (const c of candidates) {
        const pos = (c.position || "Other").trim();
        if (!map.has(pos)) map.set(pos, []);
        map.get(pos).push(c);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([position, list]) => ({
            position,
            candidates: list.sort((x, y) => (x.ballotSerial ?? 0) > (y.ballotSerial ?? 0) ? 1 : -1),
        }));
}

export default function Vote() {
    const navigate   = useNavigate();
    const { election } = useAppStore();
    const electionId   = election?.id;

    const [positions, setPositions] = useState([]);
    const [selected, setSelected]   = useState({});
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const tokenId = useMemo(() => {
        try { return sessionStorage.getItem("vote_token"); } catch { return null; }
    }, []);

    const missing = useMemo(
        () => positions.filter(p => !selected[p.position]).map(p => p.position),
        [positions, selected]
    );

    useEffect(() => {
        let alive = true;
        async function load() {
            if (!electionId) { setLoading(false); setError({ message: "No election selected." }); return; }
            setLoading(true);
            const res = await OVS.getVoterCandidates({ electionId });
            if (!alive) return;
            setLoading(false);
            if (!res.ok) { setError(res.error); return; }
            setPositions(groupByPosition(res.data || []));
        }
        load();
        return () => { alive = false; };
    }, [electionId]);

    function pick(position, candidateId) {
        setSelected(prev => ({ ...prev, [position]: candidateId }));
    }

    function goToReview() {
        if (missing.length > 0 || !tokenId) return;
        try {
            sessionStorage.setItem("ballot_review", JSON.stringify({
                electionId,
                selected,
                candidates: positions.flatMap(p => p.candidates.map(c => ({
                    id: c.id, firstName: c.firstName, lastName: c.lastName, name: c.name,
                    party: c.party, position: c.position, photoUrl: c.photoUrl,
                    image: c.image, ballotSerial: c.ballotSerial,
                }))),
                createdAt: Date.now(),
            }));
        } catch {}
        navigate("/final-vote");
    }

    return (
        <VoterShell wide>
            <Steps steps={STEPS} current={2} />

            <div className="flex items-start justify-between gap-4 flex-wrap animate-up">
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Select Your Candidates</h1>
                    <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                        Choose one candidate per position. You'll review before submitting.
                    </p>
                </div>
                {/* token indicator */}
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
          <span
              style={{ width: 7, height: 7, borderRadius: "50%", background: tokenId ? "var(--green)" : "var(--orange)", display: "inline-block" }}
          />
                    <span style={{ fontSize: 11.5, color: "var(--t2)" }}>
            {tokenId ? "Token loaded · ready" : "No token — verify first"}
          </span>
                </div>
            </div>

            <ErrorBanner error={error} onClose={() => setError(null)} />

            {loading ? (
                <Spinner text="Loading candidates…" />
            ) : positions.length === 0 ? (
                <Panel><div className="py-10 text-center" style={{ color: "var(--t3)" }}>No candidates available.</div></Panel>
            ) : (
                <div className="flex flex-col gap-4 animate-up-2">
                    {positions.map(pos => {
                        const isPicked = !!selected[pos.position];
                        return (
                            <Panel
                                key={pos.position}
                                title={pos.position}
                                action={
                                    isPicked
                                        ? <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--green)" }}><CheckCircle2 size={14} /> Selected</span>
                                        : <span style={{ fontSize: 11, fontWeight: 600, color: "var(--orange)" }}>Selection required</span>
                                }
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    {pos.candidates.map(c => {
                                        const isPicked = selected[pos.position] === c.id;
                                        const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.name || "Candidate";
                                        const initials = fullName.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();

                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => pick(pos.position, c.id)}
                                                className="relative overflow-hidden rounded-xl text-left transition-all"
                                                style={{
                                                    background: "var(--surface-2)",
                                                    border: `1px solid ${isPicked ? "var(--purple)" : "var(--border)"}`,
                                                    boxShadow: isPicked ? "0 0 0 1px var(--purple)" : "none",
                                                }}
                                                onMouseEnter={ev => { if (!isPicked) ev.currentTarget.style.borderColor = "var(--purple-b)"; }}
                                                onMouseLeave={ev => { if (!isPicked) ev.currentTarget.style.borderColor = "var(--border)"; }}
                                            >
                                                {/* checkmark */}
                                                {isPicked && (
                                                    <div
                                                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                                                        style={{ background: "var(--purple)", zIndex: 1 }}
                                                    >✓</div>
                                                )}

                                                {/* photo / initials */}
                                                <div
                                                    className="h-[100px] w-full flex items-center justify-center text-[28px] font-bold"
                                                    style={{ background: "var(--surface-3)", color: "var(--t3)" }}
                                                >
                                                    {c.photoUrl
                                                        ? <img src={c.photoUrl} alt={fullName} className="h-[100px] w-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                                                        : initials}
                                                </div>

                                                <div className="p-3">
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{fullName}</div>
                                                    <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 3 }}>{c.party || "Independent"}</div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span style={{ fontSize: 10.5, color: "var(--t3)" }}>{c.position}</span>
                                                        <span style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>#{c.ballotSerial}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Panel>
                        );
                    })}

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-3 animate-up-4">
                        <p style={{ fontSize: 12, color: missing.length > 0 ? "var(--orange)" : "var(--green)" }}>
                            {missing.length > 0 ? `Missing: ${missing.join(", ")}` : "✓ All positions selected"}
                        </p>
                        <Btn
                            variant="primary" size="lg"
                            disabled={missing.length > 0 || !tokenId}
                            onClick={goToReview}
                        >
                            Review Selections →
                        </Btn>
                        <p style={{ fontSize: 11.5, color: "var(--t3)" }}>
                            You will confirm on the next page before submitting.
                        </p>
                    </div>
                </div>
            )}
        </VoterShell>
    );
}

