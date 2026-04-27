// src/pages/voter/ElectionSelect.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { VoterShell } from "../layout/PubliceLayout.jsx";
import { Steps, Panel, ErrorBanner, Btn, Spinner, EmptyState } from "../ui";

const STEPS = ["Select Election", "Verify ID", "Cast Ballot", "Confirm"];

export default function ElectionSelect() {
    const navigate   = useNavigate();
    const me         = useAppStore(s => s.me);
    const election   = useAppStore(s => s.election);
    const setElection = useAppStore(s => s.setElection);

    const [elections, setElections] = useState([]);
    const [busy, setBusy]           = useState(false);
    const [error, setError]         = useState(null);

    const orgId     = me?.organizationId;
    const selectedId = election?.id ?? "";

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!orgId) { setError({ title: "Missing organization", message: "Your account is not linked to an organization.", status: 400 }); return; }
            setBusy(true);
            try {
                const data = await withUnwrap(OVS.getVoterAllActiveElections({ orgId }));
                if (!cancelled) setElections(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!cancelled) setError(toAppError(err));
            } finally {
                if (!cancelled) setBusy(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [orgId]);

    function pick(e) {
        setElection({ id: e.id, name: e.name ?? "Election", startsAt: e.startsAt ?? null, endsAt: e.endsAt ?? null });
    }

    return (
        <VoterShell>
            <Steps steps={STEPS} current={0} />

            <div className="animate-up">
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>Select an Election</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>Choose an active election for your organization</p>
            </div>

            <Panel
                title="Active Elections"
                subtitle={`${me?.organizationId ? "Your organization" : ""} · ${elections.length} active`}
                className="animate-up-2"
            >
                <ErrorBanner error={error} onClose={() => setError(null)} />

                {busy ? (
                    <Spinner text="Loading elections…" />
                ) : elections.length === 0 && !error ? (
                    <EmptyState icon="🗳" title="No active elections" subtitle="There are no running elections for your organization right now." />
                ) : (
                    <div className="flex flex-col gap-2.5 mt-3">
                        {elections.map(e => {
                            const isSelected = selectedId === e.id;
                            return (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => pick(e)}
                                    className="text-left rounded-xl p-4 transition-all w-full"
                                    style={{
                                        background: isSelected ? "var(--purple-d)" : "var(--surface-2)",
                                        border: `1px solid ${isSelected ? "var(--purple)" : "var(--border)"}`,
                                    }}
                                    onMouseEnter={ev => { if (!isSelected) ev.currentTarget.style.borderColor = "var(--purple-b)"; }}
                                    onMouseLeave={ev => { if (!isSelected) ev.currentTarget.style.borderColor = "var(--border)"; }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{e.name}</div>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>ID: {String(e.id).slice(0,8)}</span>
                                                {e.startsAt && <span style={{ fontSize: 10.5, color: "var(--t3)" }}>Starts: {String(e.startsAt)}</span>}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--purple)", flexShrink: 0 }}>✓ Selected</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </Panel>

            <div className="flex justify-end animate-up-3">
                <Btn variant="primary" size="lg" disabled={!selectedId} onClick={() => navigate("/verification")}>
                    Continue →
                </Btn>
            </div>

            {selectedId && (
                <p className="text-center animate-up-4" style={{ fontSize: 11.5, color: "var(--t3)" }}>
                    Selection is saved for this tab until you finish voting.
                </p>
            )}
        </VoterShell>
    );
}
