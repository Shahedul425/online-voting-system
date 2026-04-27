/*
 * Endpoint: OVS.forgotPassword({ email }) — POST /public/auth/forgot-password
 *
 * Backend (AuthController) currently STUBS this endpoint: it logs at INFO and
 * returns 202 with an enumeration-safe message. SMTP isn't wired yet, so no
 * real email is sent — this is documented in RUNBOOK.md ("Email delivery").
 *
 * UX: one-shot form with the standard "if an account exists with that email,
 * we've sent a link" message — even on 404 — to prevent email-enumeration.
 *
 * In dev mode (Vite import.meta.env.DEV) we surface a small notice so users
 * know not to expect an inbox; production users see only the safe message.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { Btn } from "../../ui/Primitives";
import { Field } from "./SignIn";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

const IS_DEV = (typeof import.meta !== "undefined") && !!import.meta.env?.DEV;

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState(null);
  // Captured to surface the backend's actual reply when in dev (it's safe — it
  // doesn't reveal whether the email exists).
  const [serverNote, setServerNote] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    setErr(null); setLoading(true); setServerNote("");
    try {
      // Always show the success state (enumeration-safe). Real network
      // failures (DNS, CORS, 5xx) we DO want to surface — silently swallowing
      // them is what made the page feel broken before.
      const resp = await withUnwrap(OVS.forgotPassword({ email })).catch((e) => {
        // Treat any 4xx as enumeration-safe success; only re-raise on
        // genuine network/server failure so the user can retry.
        const status = Number(e?.status || e?.statusCode || 0);
        if (status === 0 || status >= 500) throw e;
        return null;
      });
      if (resp && typeof resp === "object" && resp.message) {
        setServerNote(String(resp.message));
      }
      setSent(true);
    } catch (e) {
      setErr(e?.message || "We couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <PublicShell>
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl text-white mx-auto flex items-center justify-center mb-4 animate-pop"
            style={{ background: "var(--grad-primary)" }}
          >
            <Icon name="mail-check" className="w-8 h-8" />
          </div>
          <div className="display text-2xl font-bold mb-2" style={{ color: "var(--t1)" }}>
            Check your inbox
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--t2)" }}>
            If an account exists for <strong style={{ color: "var(--t1)" }}>{email}</strong>,
            we&apos;ve sent a password-reset link. Follow the link within 30 minutes.
          </p>

          {IS_DEV && (
            <div
              className="text-[11px] p-3 rounded-lg mb-5 text-left mx-auto max-w-sm"
              style={{
                background: "rgba(232, 124, 102, 0.08)",
                color: "var(--t2)",
                border: "1px solid rgba(232, 124, 102, 0.18)",
              }}
            >
              <div className="font-semibold mb-1" style={{ color: "var(--coral)" }}>
                <Icon name="info" className="w-3.5 h-3.5 inline-block mr-1" />
                Dev mode
              </div>
              <p>
                SMTP isn&apos;t wired in this environment, so no real email is sent.
                See <span className="mono">RUNBOOK.md → Email delivery</span> to enable
                Gmail/Keycloak SMTP, or reset the password directly in Keycloak admin
                (<span className="mono">http://localhost:8081</span>) for local demos.
              </p>
              {serverNote && (
                <p className="mt-2 italic">Server replied: {serverNote}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Link to="/signin" className="btn btn-primary justify-center">
              <Icon name="arrow-left" className="w-4 h-4" /> Back to sign in
            </Link>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); setServerNote(""); }}
              className="btn btn-ghost justify-center"
            >
              Use a different email
            </button>
          </div>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="max-w-md mx-auto px-6 py-16">
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80"
          style={{ color: "var(--t2)" }}
        >
          <Icon name="arrow-left" className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="card p-8 shadow-lift">
          <div className="display text-3xl font-bold mb-1" style={{ color: "var(--t1)" }}>
            Forgot your password?
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            Enter your email and we&apos;ll send a link to reset it. For your safety we&apos;ll
            send the same response whether the email is on file or not.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              icon="mail"
              autoComplete="email"
            />

            {err && (
              <div
                className="text-xs p-2 rounded-lg"
                style={{ color: "var(--err, #c14545)", background: "rgba(193,69,69,0.08)" }}
              >
                {err}
              </div>
            )}

            <Btn
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={loading || !email}
            >
              {loading ? "Sending…" : <><Icon name="send" className="w-4 h-4" /> Send reset link</>}
            </Btn>
          </form>

          <div className="text-sm mt-6 text-center" style={{ color: "var(--t2)" }}>
            Remembered it?{" "}
            <Link to="/signin" className="font-semibold" style={{ color: "var(--coral)" }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
