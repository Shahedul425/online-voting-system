// src/pages/voter/Verification.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { VoteToken } from "../../Service/GlobalState/voteTokenStore";
import { VoterShell } from "../layout/PubliceLayout";
import { Steps, Panel, FormGroup, Input, Btn, ErrorBanner, HintBox } from "../ui";

const STEPS = ["Select Election", "Verify ID", "Cast Ballot", "Confirm"];

export default function Verification() {
    const navigate   = useNavigate();
    const election   = useAppStore(s => s.election);

    const [voterId, setVoterId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [token, setToken]     = useState(null); // TokenDTO

    // Guard: must have election
    useEffect(() => {
        if (!election?.id) navigate("/select", { replace: true });
    }, [election, navigate]);

    const canVerify = voterId.trim().length >= 3;

    async function onVerify() {
        setError(null);
        setToken(null);
        if (!election?.id) { navigate("/select", { replace: true }); return; }

        setLoading(true);
        // POST /voter/verification/verify?voterId=&electionId=
        const res = await OVS.verifyVoter({ voterId: voterId.trim(), electionId: election.id });
        setLoading(false);

        if (!res.ok) { setError(res.error); return; }

        // Store token: { tokenId, expiryTime }
        VoteToken.set({ tokenId: res.data.tokenId, expiryTime: res.data.expiryTime });
        sessionStorage.setItem("vote_token", res.data.tokenId);
        setToken(res.data);
        navigate("/vote", { replace: true });
    }

    return (
        <VoterShell>
            <Steps steps={STEPS} current={1} />

            <div className="animate-up">
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Voter Verification</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    Enter your voter ID to receive a one-time voting token
                </p>
            </div>

            <Panel className="animate-up-2"
                   title={election?.name ?? "Election"}
                   subtitle={`LSBU Student Union`}
                   action={
                       <Btn variant="ghost" size="sm" onClick={() => navigate("/select")}>Change</Btn>
                   }
            >
                <ErrorBanner error={error} onClose={() => setError(null)} />

                <div className="flex flex-col gap-4 mt-3">
                    <FormGroup
                        label="Voter ID"
                        required
                        hint="Your voter ID from the official register — minimum 3 characters"
                    >
                        <Input
                            value={voterId}
                            onChange={e => { setVoterId(e.target.value); setError(null); }}
                            placeholder="e.g. LSBU-1001"
                            onKeyDown={e => e.key === "Enter" && canVerify && onVerify()}
                        />
                        {voterId.length > 0 && !canVerify && (
                            <p style={{ fontSize: 11, color: "var(--orange)", marginTop: 4 }}>
                                Voter ID must be at least 3 characters.
                            </p>
                        )}
                    </FormGroup>

                    <HintBox type="info">
                        Your voter ID and email must match the voter list uploaded by your admin.
                        If verification fails, contact your election administrator.
                    </HintBox>

                    <Btn
                        variant="primary" size="lg"
                        loading={loading}
                        disabled={!canVerify}
                        onClick={onVerify}
                        className="w-full"
                    >
                        {loading ? "Verifying…" : "Verify & Get Token →"}
                    </Btn>
                </div>

                {token && (
                    <div
                        className="mt-4 rounded-xl p-4 flex items-start gap-3"
                        style={{ background: "var(--green-d)", border: "1px solid var(--green-b)" }}
                    >
                        <div style={{ fontSize: 20, color: "var(--green)", flexShrink: 0 }}>🔑</div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 4 }}>
                                One-Time Voting Token
                            </div>
                            <div style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--cyan)", wordBreak: "break-all", lineHeight: 1.6 }}>
                                {token.tokenId}
                            </div>
                            {token.expiryTime && (
                                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 6 }}>
                                    Expires: {new Date(token.expiryTime).toLocaleString()} · Do not share
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Panel>

            <p className="text-center animate-up-4" style={{ fontSize: 11, color: "var(--t3)" }}>
                Token is valid for 10 minutes after issuance.
            </p>
        </VoterShell>
    );
}
