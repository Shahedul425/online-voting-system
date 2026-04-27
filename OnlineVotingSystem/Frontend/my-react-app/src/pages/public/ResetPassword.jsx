/*
 * Endpoint: OVS.resetPassword({ token, password }) — POST /public/auth/reset-password
 *
 * Route: /reset-password?token=<jwt-or-opaque>
 * Entry point from the email we send in ForgotPassword.
 */
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { Btn } from "../../ui/Primitives";
import { PasswordField } from "./SignIn";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function ResetPassword() {
  const [params]  = useSearchParams();
  const token     = params.get("token") || "";
  const navigate  = useNavigate();

  const [pw1, setPw1]         = useState("");
  const [pw2, setPw2]         = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);
  const [done, setDone]       = useState(false);

  const mismatched = pw1 && pw2 && pw1 !== pw2;
  const tooShort   = pw1 && pw1.length < 8;
  const canSubmit  = token && pw1.length >= 8 && pw1 === pw2;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null); setLoading(true);
    try {
      if (OVS.resetPassword) {
        await withUnwrap(OVS.resetPassword({ token, password: pw1 }));
      }
      setDone(true);
    } catch (e) {
      setErr(e?.message || "Couldn't reset password. Your link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <PublicShell>
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: "var(--red-d)", color: "var(--red)" }}
          >
            <Icon name="alert-triangle" className="w-7 h-7" />
          </div>
          <div className="display text-2xl font-bold mb-2" style={{ color: "var(--t1)" }}>
            Missing reset link
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            This page needs a token from the email we sent. Request a fresh link to continue.
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            <Icon name="send" className="w-4 h-4" /> Get a new link
          </Link>
        </section>
      </PublicShell>
    );
  }

  if (done) {
    return (
      <PublicShell>
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl text-white mx-auto flex items-center justify-center mb-4 animate-pop"
            style={{ background: "var(--grad-primary)" }}
          >
            <Icon name="check" className="w-8 h-8" />
          </div>
          <div className="display text-2xl font-bold mb-2" style={{ color: "var(--t1)" }}>
            Password updated
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            You can now sign in with your new password.
          </p>
          <Btn variant="primary" onClick={() => navigate("/signin", { replace: true })}>
            <Icon name="arrow-right" className="w-4 h-4" /> Sign in
          </Btn>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="card p-8 shadow-lift">
          <div className="display text-3xl font-bold mb-1" style={{ color: "var(--t1)" }}>
            Set a new password
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            Pick something you haven&apos;t used before. Minimum 8 characters.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <PasswordField
              label="New password"
              value={pw1}
              onChange={setPw1}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm new password"
              value={pw2}
              onChange={setPw2}
              autoComplete="new-password"
            />

            {tooShort && (
              <div className="text-xs" style={{ color: "var(--orange)" }}>
                Password must be at least 8 characters.
              </div>
            )}
            {mismatched && (
              <div className="text-xs" style={{ color: "var(--orange)" }}>
                Passwords don&apos;t match.
              </div>
            )}
            {err && (
              <div
                className="text-xs p-2 rounded-lg"
                style={{ color: "var(--err)", background: "rgba(193,69,69,0.08)" }}
              >
                {err}
              </div>
            )}

            <Btn
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={loading || !canSubmit}
            >
              {loading ? "Updating…" : <><Icon name="key" className="w-4 h-4" /> Update password</>}
            </Btn>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
