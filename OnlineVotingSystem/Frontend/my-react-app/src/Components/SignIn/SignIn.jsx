// src/pages/auth/SignIn.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../Service/Api/formErrorHelpers";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import { AuthToken } from "../../Service/GlobalState/authToken";
import {
    AuthShell, AuthCard, AuthCardHeader, AuthCardBody, AuthCardFooter,
} from "../layout/PubliceLayout.jsx";
import {
    FormGroup, Input, Btn, ErrorBanner, HintBox,
} from "../ui";

function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function SignIn() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const setMe     = useAppStore(s => s.setMe);
    const clearMe   = useAppStore(s => s.clearMe);

    const [form, setForm]           = useState({ email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError]         = useState(null);
    const [busy, setBusy]           = useState(false);
    const [showPass, setShowPass]   = useState(false);

    const onChange = e => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setError(null);
        setFieldErrors(p => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!form.email.trim())               errs.email    = "Email is required.";
        else if (!isValidEmail(form.email))   errs.email    = "Enter a valid email.";
        if (!form.password)                   errs.password = "Password is required.";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError(null);
        if (!validate()) return;

        setBusy(true);
        try {
            // 1. Login → get access token
            const loginRes = await withUnwrap(
                OVS.login({ email: form.email.trim(), password: form.password })
            );
            if (!loginRes?.accessToken) {
                throw { message: "Authentication failed: no access token returned.", status: 401 };
            }
            AuthToken.set(loginRes.accessToken);

            // 2. Fetch /user/me
            const me = await withUnwrap(OVS.me());
            setMe(me);

            // 3. Role-based redirect
            const from    = location.state?.from?.pathname;
            const role    = String(me?.role ?? "").toLowerCase();
            const dflt    = role === "admin" ? "/admin"
                : role === "superadmin" ? "/superAdmin"
                    : "/select";
            navigate(from || dflt, { replace: true });

        } catch (err) {
            clearMe();
            AuthToken.clear();
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors(p => mergeFieldErrors(p, appErr));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthShell>
            <AuthCard>
                <AuthCardHeader
                    title="Welcome back"
                    subtitle="Sign in to vote or manage elections"
                />
                <AuthCardBody>
                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        <ErrorBanner error={error} onClose={() => setError(null)} />

                        <FormGroup label="Email address" required error={fieldErrors.email}>
                            <Input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onChange}
                                placeholder="you@lsbu.ac.uk"
                                autoComplete="email"
                                error={!!fieldErrors.email}
                            />
                        </FormGroup>

                        <FormGroup label="Password" required error={fieldErrors.password}>
                            <div className="relative">
                                <Input
                                    name="password"
                                    type={showPass ? "text" : "password"}
                                    value={form.password}
                                    onChange={onChange}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    error={!!fieldErrors.password}
                                    style={{ paddingRight: 60 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
                                    style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer" }}
                                >
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </FormGroup>

                        <Btn type="submit" variant="primary" size="lg" loading={busy} className="w-full mt-1">
                            {busy ? "Signing in…" : "Sign in →"}
                        </Btn>

                        <div className="flex items-center justify-between pt-1" style={{ fontSize: 12, color: "var(--t3)" }}>
                            <span>Don't have an account?</span>
                            <Link to="/signup" style={{ color: "var(--purple)", fontWeight: 600, textDecoration: "none" }}>
                                Create one
                            </Link>
                        </div>
                    </form>
                </AuthCardBody>
                <AuthCardFooter>
                    {error?.requestId
                        ? <>Reference ID: <span className="mono">{error.requestId}</span> — share this with support</>
                        : "If you contact support, share the Reference ID shown above."}
                </AuthCardFooter>
            </AuthCard>
        </AuthShell>
    );
}
