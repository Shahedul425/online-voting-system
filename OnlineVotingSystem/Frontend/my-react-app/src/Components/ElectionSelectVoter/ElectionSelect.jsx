import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../Errors/ErrorBanner";

export default function ElectionSelect() {
    const navigate = useNavigate();

    const me = useAppStore((s) => s.me);
    const election = useAppStore((s) => s.election);
    const setElection = useAppStore((s) => s.setElection);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [elections, setElections] = useState([]);

    const orgId = me?.organizationId;

    const selectedId = election?.id ?? "";

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setError(null);

            if (!orgId) {
                // Superadmin/admin without org shouldn't be on voter flow anyway,
                // but keep a sane message.
                setError({
                    title: "Missing organization",
                    message: "Your account is not linked to an organization.",
                    status: 400,
                    code: "ORG_MISSING",
                });
                return;
            }

            setBusy(true);
            try {
                const data = await withUnwrap(OVS.getVoterAllActiveElections({ orgId }));
                if (cancelled) return;

                // normalize list (in case backend returns something unexpected)
                const list = Array.isArray(data) ? data : [];
                setElections(list);
            } catch (err) {
                if (cancelled) return;
                setError(toAppError(err));
            } finally {
                if (!cancelled) setBusy(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [orgId]);

    const canContinue = useMemo(() => !!selectedId, [selectedId]);

    const onPick = (e) => {
        // store minimal safe shape (don’t rely on extra fields later)
        setElection({
            id: e.id,
            name: e.name ?? e.title ?? "Election",
            // keep any other fields you actually need
            startsAt: e.startsAt ?? e.startDate ?? null,
            endsAt: e.endsAt ?? e.endDate ?? null,
        });
    };

    const onContinue = () => {
        if (!canContinue) return;
        navigate("/verification");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-indigo-400 tracking-tight">
                        Select Election
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Choose an active election for your organization.
                    </p>
                </div>

                <ErrorBanner error={error} onClose={() => setError(null)} className="mb-4" />

                <div className="rounded-2xl bg-gray-900/70 border border-gray-800 shadow-2xl p-6 space-y-4 backdrop-blur">
                    {busy ? (
                        <div className="text-sm text-gray-300">Loading elections…</div>
                    ) : elections.length === 0 ? (
                        <div className="text-sm text-gray-400">
                            No active elections available for your organization.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {elections.map((e) => {
                                const isActive = selectedId === e.id;
                                return (
                                    <button
                                        key={e.id}
                                        type="button"
                                        onClick={() => onPick(e)}
                                        className={[
                                            "w-full text-left px-4 py-3 rounded-xl border transition",
                                            isActive
                                                ? "border-indigo-500 bg-indigo-600/15"
                                                : "border-gray-800 hover:border-indigo-400 hover:bg-gray-800/40",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-semibold text-white">
                                                    {e.name}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    ID: {e.id}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <span className="text-xs font-semibold text-indigo-300">
                          Selected
                        </span>
                                            )}
                                        </div>

                                        {(e.startsAt || e.startDate) && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Starts: {String(e.startsAt ?? e.startDate)}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <button
                        type="button"
                        disabled={!canContinue}
                        onClick={onContinue}
                        className={[
                            "w-full py-2.5 rounded-xl font-semibold text-white shadow-md transition",
                            canContinue
                                ? "bg-indigo-600 hover:bg-indigo-500"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed",
                        ].join(" ")}
                    >
                        Continue
                    </button>
                </div>

                {selectedId && (
                    <p className="mt-4 text-center text-xs text-gray-500">
                        Selection is saved for this tab until you finish voting.
                    </p>
                )}
            </div>
        </div>
    );
}

