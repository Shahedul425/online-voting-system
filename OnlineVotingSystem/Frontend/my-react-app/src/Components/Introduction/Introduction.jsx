// src/pages/voter/Introduction.jsx
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Vote, IdCard, CheckCircle2, Lock, Clock } from "lucide-react";
import { PublicNavbar } from "../layout/PubliceLayout";
import { Btn } from "../ui";

const FEATURES = [
    { icon: <IdCard size={22} />,        title: "Easy ID Verification",     sub: "Verify identity with your voter ID" },
    { icon: <Vote size={22} />,          title: "Simple Ballot Selection",  sub: "Pick one candidate per position" },
    { icon: <ShieldCheck size={22} />,   title: "Cryptographic Proof",      sub: "Merkle tree seals every ballot" },
    { icon: <CheckCircle2 size={22} />,  title: "Instant Receipt",          sub: "Verify your vote was counted" },
    { icon: <Lock size={22} />,          title: "Full Audit Trail",         sub: "Every action logged immutably" },
    { icon: <Clock size={22} />,         title: "Vote Any Time",            sub: "Open 24/7 during election window" },
];

export default function Introduction() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
            <PublicNavbar />

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 relative overflow-hidden">
                {/* ambient glow */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: -120, left: "50%", transform: "translateX(-50%)",
                        width: 600, height: 600, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(124,111,247,.1) 0%, transparent 70%)",
                    }}
                />

                {/* Tag */}
                <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 animate-up"
                    style={{ background: "var(--purple-d)", border: "1px solid var(--purple-b)", fontSize: 11.5, fontWeight: 600, color: "var(--purple)" }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                    Secure · Transparent · Verified
                </div>

                {/* Headline */}
                <h1
                    className="animate-up-2"
                    style={{ fontSize: 42, fontWeight: 700, color: "var(--t1)", lineHeight: 1.15, letterSpacing: "-.02em", maxWidth: 580 }}
                >
                    Cast Your Vote with{" "}
                    <span style={{ background: "linear-gradient(135deg, var(--purple), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Confidence
          </span>
                </h1>

                <p
                    className="animate-up-2"
                    style={{ fontSize: 14, color: "var(--t3)", marginTop: 14, maxWidth: 440, lineHeight: 1.7 }}
                >
                    A modern, tamper-proof digital voting platform built for organizations that care about democratic integrity.
                </p>

                <div className="flex gap-3 mt-7 justify-center flex-wrap animate-up-3">
                    <Btn variant="primary" size="lg" onClick={() => navigate("/signin")}>Get Started →</Btn>
                    <Btn variant="ghost"   size="lg" onClick={() => navigate("/verify/receipt")}>Verify a Receipt</Btn>
                </div>

                {/* Feature grid */}
                <div
                    className="grid grid-cols-3 gap-3 mt-12 w-full animate-up-4"
                    style={{ maxWidth: 640 }}
                >
                    {FEATURES.map(f => (
                        <div
                            key={f.title}
                            className="rounded-xl p-4 text-center transition-all"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--purple-b)"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                        >
                            <div style={{ color: "var(--purple)", marginBottom: 8, display: "flex", justifyContent: "center" }}>{f.icon}</div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{f.title}</div>
                            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>{f.sub}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
            >
        <span style={{ fontSize: 11.5, color: "var(--t3)" }}>
          © {new Date().getFullYear()} OVS — Your vote is protected
        </span>
                <div className="flex gap-5">
                    {["Privacy", "Terms", "Help", "Contact"].map(l => (
                        <span key={l} style={{ fontSize: 11.5, color: "var(--t3)", cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.color = "var(--t2)"}
                              onMouseLeave={e => e.currentTarget.style.color = "var(--t3)"}>
              {l}
            </span>
                    ))}
                </div>
            </footer>
        </div>
    );
}
