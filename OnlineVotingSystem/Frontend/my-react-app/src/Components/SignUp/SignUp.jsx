// src/pages/auth/SignUp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { OVS } from "../../Service/Api/endpoints";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { mergeFieldErrors } from "../../Service/Api/formErrorHelpers";
import { withUnwrap } from "../../Service/Api/apiUnwrap";
import {
    AuthShell, AuthCard, AuthCardHeader, AuthCardBody, AuthCardFooter,
} from "../layout/PubliceLayout";
import {
    FormGroup, Input, Btn, ErrorBanner, HintBox,
} from "../ui";

function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function SignUp() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError]   = useState(null);
    const [busy, setBusy]     = useState(false);
    const [showPass, setShowPass] = useState(false);

    const onChange = e => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setError(null);
        setFieldErrors(p => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!form.firstName.trim()) errs.firstName = "First name is required.";
        if (!form.lastName.trim())  errs.lastName  = "Last name is required.";
        if (!form.email.trim())             errs.email = "Email is required.";
        else if (!isValidEmail(form.email)) errs.email = "Enter a valid email.";
        if (!form.password)                 errs.password = "Password is required.";
        else if (form.password.length < 8)  errs.password = "Password must be at least 8 characters.";
        if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError(null);
        if (!validate()) return;

        setBusy(true);
        try {
            // POST /public/auth/register → RegisterRequest
            await withUnwrap(
                OVS.register({
                    email:     form.email.trim().toLowerCase(),
                    password:  form.password,
                    firstName: form.firstName.trim(),
                    lastName:  form.lastName.trim(),
                })
            );
            navigate("/signin", { replace: true, state: { registered: true } });
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors(p => mergeFieldErrors(p, appErr));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthShell>
            <AuthCard wide>
                <AuthCardHeader
                    title="Create account"
                    subtitle="Register with your organization email to start voting"
                />
                <AuthCardBody>
                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        <ErrorBanner error={error} onClose={() => setError(null)} />

                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormGroup label="First name" required error={fieldErrors.firstName}>
                                <Input name="firstName" value={form.firstName} onChange={onChange}
                                       placeholder="Alice" error={!!fieldErrors.firstName} />
                            </FormGroup>
                            <FormGroup label="Last name" required error={fieldErrors.lastName}>
                                <Input name="lastName" value={form.lastName} onChange={onChange}
                                       placeholder="Chen" error={!!fieldErrors.lastName} />
                            </FormGroup>
                        </div>

                        <FormGroup
                            label="Email address"
                            required
                            hint="Must match your organization's registered domain (e.g. lsbu.ac.uk)"
                            error={fieldErrors.email}
                        >
                            <Input name="email" type="email" value={form.email} onChange={onChange}
                                   placeholder="you@lsbu.ac.uk" autoComplete="email" error={!!fieldErrors.email} />
                        </FormGroup>

                        <FormGroup label="Password" required error={fieldErrors.password}
                                   hint="Minimum 8 characters">
                            <div className="relative">
                                <Input name="password" type={showPass ? "text" : "password"}
                                       value={form.password} onChange={onChange} placeholder="Min 8 characters"
                                       error={!!fieldErrors.password} style={{ paddingRight: 60 }} />
                                <button type="button" onClick={() => setShowPass(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer" }}>
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </FormGroup>

                        <FormGroup label="Confirm password" required error={fieldErrors.confirmPassword}>
                            <Input name="confirmPassword" type="password"
                                   value={form.confirmPassword} onChange={onChange}
                                   placeholder="Repeat your password" error={!!fieldErrors.confirmPassword} />
                        </FormGroup>

                        <HintBox type="info">
                            Your email domain must be registered by your organization admin. If you get an
                            <strong className="mx-1" style={{ color: "var(--t1)" }}>ORGANIZATION_NOT_FOUND</strong>
                            error, contact your admin.
                        </HintBox>

                        <Btn type="submit" variant="primary" size="lg" loading={busy} className="w-full mt-1">
                            {busy ? "Creating account…" : "Create account →"}
                        </Btn>

                        <div className="text-center" style={{ fontSize: 12, color: "var(--t3)" }}>
                            Already registered?{" "}
                            <Link to="/signin" style={{ color: "var(--purple)", fontWeight: 600, textDecoration: "none" }}>
                                Sign in
                            </Link>
                        </div>
                    </form>
                </AuthCardBody>
            </AuthCard>
        </AuthShell>
    );
}
