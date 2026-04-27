/*
 * SignUp — matches backend RegisterRequest (record):
 *
 *   { email, password, firstName, lastName }
 *
 * The organisation is derived server-side from the email domain
 * (RegisterService.extractDomain → OrganizationRepository.findByDomain).
 * If the domain doesn't match an existing org we surface a friendly
 * "request your organisation" CTA pre-filled with the email.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { Btn } from "../../ui/Primitives";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { Field, PasswordField } from "./SignIn";

// Backend signals an org-domain miss with code=ORGANIZATION_NOT_FOUND (404).
function looksLikeOrgMissing(err) {
  if (!err) return false;
  const code = String(err?.code || err?.errorCode || "").toUpperCase();
  const msg  = String(err?.message || err || "").toLowerCase();
  const status = Number(err?.status || err?.statusCode || 0);
  return (
    code === "ORGANIZATION_NOT_FOUND" ||
    code === "ORG_NOT_FOUND" ||
    msg.includes("no organization found") ||
    msg.includes("organisation not found") ||
    msg.includes("organization not found") ||
    (status === 404 && (msg.includes("org") || msg.includes("domain")))
  );
}

// Naive but predictable "split a full name into first + last".
// Single token → firstName only, lastName left as a single dot so the
// backend's @NotBlank doesn't trip; we tell the user to provide a surname
// in the validation error if that ever happens.
function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function emailDomain(email) {
  const e = String(email || "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  return at > 0 ? e.slice(at + 1) : "";
}

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState(null);
  const [done, setDone]             = useState(false);
  const [orgMissing, setOrgMissing] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setOrgMissing(false);

    // client-side guards before we hit the wire
    const { firstName, lastName } = splitName(form.fullName);
    if (!firstName || !lastName) {
      setErr("Please enter your full name (first and last).");
      return;
    }
    if (!form.email.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    if ((form.password || "").length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await withUnwrap(OVS.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName,
        lastName,
      }));
      setDone(true);
    } catch (e) {
      if (looksLikeOrgMissing(e)) {
        setOrgMissing(true);
      } else {
        setErr(e?.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Success state ---------- */
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
            Account created
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            You can now sign in with <strong style={{ color: "var(--t1)" }}>{form.email}</strong>.
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button onClick={() => navigate("/signin")} className="btn btn-primary justify-center">
              <Icon name="log-in" className="w-4 h-4" /> Continue to sign in
            </button>
            <Btn variant="ghost" onClick={() => navigate("/")}>
              <Icon name="arrow-left" className="w-4 h-4" /> Back to home
            </Btn>
          </div>
        </section>
      </PublicShell>
    );
  }

  /* ---------- Org-not-found state ---------- */
  if (orgMissing) {
    const domain = emailDomain(form.email);
    return (
      <PublicShell>
        <section className="max-w-md mx-auto px-6 py-16">
          <div className="card p-8 shadow-lift text-center">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: "rgba(232, 124, 102, 0.12)", color: "var(--coral)" }}
            >
              <Icon name="building-2" className="w-7 h-7" />
            </div>
            <div className="display text-2xl font-bold mb-2" style={{ color: "var(--t1)" }}>
              Your organisation isn&apos;t set up yet
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
              We couldn&apos;t find a TrustVote organisation that matches the email domain{" "}
              <strong style={{ color: "var(--t1)" }}>@{domain || "—"}</strong>. To get an
              account, an admin from your organisation needs to request it first.
            </p>

            <div className="flex flex-col gap-2">
              <Link
                to={`/request-org?email=${encodeURIComponent(form.email)}&contact=${encodeURIComponent(form.fullName)}`}
                className="btn btn-primary justify-center"
              >
                <Icon name="send" className="w-4 h-4" /> Request your organisation
              </Link>
              <button
                type="button"
                onClick={() => { setOrgMissing(false); }}
                className="btn btn-ghost justify-center"
              >
                <Icon name="arrow-left" className="w-4 h-4" /> Go back and edit
              </button>
            </div>
          </div>
        </section>
      </PublicShell>
    );
  }

  /* ---------- Default form state ---------- */
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
          <div className="display text-3xl font-bold mb-1" style={{ color: "var(--t1)" }}>
            Create your account
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            We&apos;ll match you to your organisation by the email domain you sign up with.
            If your org isn&apos;t registered yet, we&apos;ll guide you through requesting it.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={v => setForm({ ...form, fullName: v })}
              icon="user"
              autoComplete="name"
            />
            <Field
              label="Work email"
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
              autoComplete="new-password"
            />
            <div className="text-[11px]" style={{ color: "var(--t3)" }}>
              At least 8 characters.
            </div>

            {err && (
              <div
                className="text-xs p-2 rounded-lg"
                style={{ color: "var(--err, #c14545)", background: "rgba(193,69,69,0.08)" }}
              >
                {err}
              </div>
            )}

            <Btn type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
              {loading ? "Submitting…" : <><Icon name="send" className="w-4 h-4" /> Create account</>}
            </Btn>

            <div className="text-[11px] text-center pt-1" style={{ color: "var(--t3)" }}>
              Don&apos;t see your organisation?{" "}
              <Link to="/request-org" style={{ color: "var(--coral)" }} className="font-semibold">
                Request it here
              </Link>
            </div>
          </form>

          <div className="text-sm mt-6 text-center" style={{ color: "var(--t2)" }}>
            Already have an account?{" "}
            <Link to="/signin" className="font-semibold" style={{ color: "var(--coral)" }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

// Field and PasswordField are imported from SignIn.jsx to keep one source of truth.
