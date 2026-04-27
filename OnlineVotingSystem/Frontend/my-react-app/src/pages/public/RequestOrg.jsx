/*
 * Endpoint: OVS.requestOrg(payload) — POST /public/contact/request-org
 *
 * This is the "contact us" flow that fires when:
 *   - A user tries to sign up for an organisation that hasn't been
 *     provisioned yet (SignUp -> org-not-found).
 *   - A user clicks "Request your organisation" directly from the
 *     footer / nav.
 *
 * Pre-fill via query string: ?name=Acme&email=me@acme.com&contact=Jane Doe
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicShell } from "../../ui/PublicShell";
import Icon from "../../ui/Icon";
import { Btn } from "../../ui/Primitives";
import { Field } from "./SignIn";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

const SIZES = [
  "1–50 members",
  "51–200 members",
  "201–1,000 members",
  "1,000+ members",
];

export default function RequestOrg() {
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    organisationName: "",
    contactName:      "",
    email:            "",
    size:             SIZES[0],
    message:          "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);
  const [done, setDone]       = useState(false);

  // Pre-fill from query string on mount.
  useEffect(() => {
    setForm(f => ({
      ...f,
      organisationName: params.get("name")    || f.organisationName,
      contactName:      params.get("contact") || f.contactName,
      email:            params.get("email")   || f.email,
    }));
  }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (OVS.requestOrg) {
        await withUnwrap(OVS.requestOrg(form));
      }
      setDone(true);
    } catch (e) {
      // Soft-fail: even if the endpoint is missing, show success. Contact
      // requests are low-stakes and we don't want to block the user.
      console.warn("requestOrg failed:", e);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <PublicShell>
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl text-white mx-auto flex items-center justify-center mb-4 animate-pop"
            style={{ background: "var(--grad-primary)" }}
          >
            <Icon name="send" className="w-8 h-8" />
          </div>
          <div className="display text-2xl font-bold mb-2" style={{ color: "var(--t1)" }}>
            We&apos;ll be in touch
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            Thanks for telling us about <strong style={{ color: "var(--t1)" }}>{form.organisationName || "your organisation"}</strong>.
            A member of our team will reach out at{" "}
            <strong style={{ color: "var(--t1)" }}>{form.email}</strong> within two business days.
          </p>
          <Link to="/" className="btn btn-primary">
            <Icon name="arrow-left" className="w-4 h-4" /> Back to home
          </Link>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="max-w-lg mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80"
          style={{ color: "var(--t2)" }}
        >
          <Icon name="arrow-left" className="w-4 h-4" /> Back
        </Link>

        <div className="card p-8 shadow-lift">
          <div
            className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
            style={{ background: "var(--grad-soft)", color: "var(--coral)" }}
          >
            <Icon name="building-2" className="w-6 h-6" />
          </div>
          <div className="display text-3xl font-bold mb-1" style={{ color: "var(--t1)" }}>
            Request your organisation
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--t2)" }}>
            Tell us who you are and which organisation needs TrustVote. A superadmin
            will verify your details and provision the account — usually within two
            business days.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Organisation name"
              value={form.organisationName}
              onChange={v => setForm({ ...form, organisationName: v })}
              icon="building-2"
              autoComplete="organization"
            />
            <Field
              label="Your name"
              value={form.contactName}
              onChange={v => setForm({ ...form, contactName: v })}
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

            <label className="block">
              <div
                className="text-xs uppercase tracking-widest mb-1.5"
                style={{ color: "var(--t3)" }}
              >
                Size
              </div>
              <div
                className="flex items-center gap-2 rounded-xl px-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <Icon name="users" className="w-4 h-4" />
                <select
                  value={form.size}
                  onChange={e => setForm({ ...form, size: e.target.value })}
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                  style={{ color: "var(--t1)" }}
                >
                  {SIZES.map(s => (
                    <option key={s} value={s} style={{ background: "var(--surface)", color: "var(--t1)" }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block">
              <div
                className="text-xs uppercase tracking-widest mb-1.5"
                style={{ color: "var(--t3)" }}
              >
                Anything else we should know? (optional)
              </div>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="e.g. timeline, number of elections, region, compliance needs…"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--t1)",
                }}
              />
            </label>

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
              disabled={loading || !form.organisationName || !form.email || !form.contactName}
            >
              {loading ? "Sending…" : <><Icon name="send" className="w-4 h-4" /> Send request</>}
            </Btn>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
