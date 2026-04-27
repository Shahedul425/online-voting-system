/*
 * Endpoint: OVS.login({ email, password }) — POST /public/auth/login
 * Response: { accessToken, role, me? } — adapt to your actual response shape.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { Btn } from "../../ui/Primitives";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { AuthToken } from "../../Service/GlobalState/authToken";
import { useAppStore } from "../../Service/GlobalState/appStore";

export default function SignIn() {
  const navigate = useNavigate();
  const setMe = useAppStore(s => s.setMe);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const res = await withUnwrap(OVS.login(form));
      AuthToken.set(res.accessToken || res.access_token || res.token);
      const me = await withUnwrap(OVS.me());
      setMe(me);
      const role = String(me.role || "").toLowerCase();
      navigate(role === "admin" ? "/admin/dashboard" : role === "superadmin" ? "/superadmin/dashboard" : "/voter/dashboard");
    } catch (e) {
      setErr(e?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicShell>
      <section className="max-w-md mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80"
          style={{ color: "var(--t2)" }}
        >
          <Icon name="arrow-left" className="w-4 h-4" /> Back
        </Link>
        <div className="card p-8 shadow-lift">
          <div className="display text-3xl font-bold mb-1" style={{ color: "var(--t1)" }}>Welcome back</div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            Sign in with your organisation email.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={v => setForm({ ...form, email: v })}
              icon="mail"
              autoComplete="email"
            />
            <PasswordField
              label="Password"
              value={form.password}
              onChange={v => setForm({ ...form, password: v })}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold hover:opacity-80"
                style={{ color: "var(--coral)" }}
              >
                Forgot password?
              </Link>
            </div>

            {err && (
              <div
                className="text-xs p-2 rounded-lg"
                style={{ color: "var(--err)", background: "rgba(193,69,69,0.08)" }}
              >
                {err}
              </div>
            )}

            <Btn type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
              {loading ? "Signing in…" : <><Icon name="arrow-right" className="w-4 h-4" /> Sign in</>}
            </Btn>
          </form>

          <div className="text-sm mt-6 text-center" style={{ color: "var(--t2)" }}>
            No account yet?{" "}
            <Link to="/signup" className="font-semibold" style={{ color: "var(--coral)" }}>
              Get started
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

/* ---------- Field primitives (exported for reuse in SignUp) ---------- */

export function Field({ label, type = "text", value, onChange, icon, autoComplete }) {
  return (
    <label className="block">
      <div
        className="text-xs uppercase tracking-widest mb-1.5"
        style={{ color: "var(--t3)" }}
      >
        {label}
      </div>
      <div
        className="flex items-center gap-2 rounded-xl px-3"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {icon && <Icon name={icon} className="w-4 h-4" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
          style={{ color: "var(--t1)" }}
        />
      </div>
    </label>
  );
}

export function PasswordField({ label = "Password", value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <div
        className="text-xs uppercase tracking-widest mb-1.5"
        style={{ color: "var(--t3)" }}
      >
        {label}
      </div>
      <div
        className="flex items-center gap-2 rounded-xl px-3"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <Icon name="lock" className="w-4 h-4" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          autoComplete={autoComplete || "current-password"}
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
          style={{ color: "var(--t1)" }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
          className="p-1 rounded hover:opacity-80 transition-opacity"
          style={{ color: "var(--t3)", background: "transparent", border: "none", cursor: "pointer" }}
        >
          <Icon name={show ? "eye-off" : "eye"} className="w-4 h-4" />
        </button>
      </div>
    </label>
  );
}
