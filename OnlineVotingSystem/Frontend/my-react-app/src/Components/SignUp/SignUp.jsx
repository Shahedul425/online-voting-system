import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerRequest } from "../../Service/Api/registerApi";
import { toAppError } from "../../Service/ErrorHandling/appError.js";
import { ErrorBanner } from "../Errors/ErrorBanner.jsx";
import { InlineFieldError } from "../Errors/InFieldError.jsx";
import { mergeFieldErrors } from "../../Service/Api/formErrorHelpers.js";
// import { withUnwrap } from "../../Service/Api/apiUnwrap.js";
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignUp() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setError(null);
        setFieldErrors((p) => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const next = {};

        if (!form.firstName.trim()) next.firstName = "First name is required.";
        if (!form.lastName.trim()) next.lastName = "Last name is required.";

        if (!form.email.trim()) next.email = "Email is required.";
        else if (!isValidEmail(form.email)) next.email = "Enter a valid email.";

        if (!form.password) next.password = "Password is required.";
        else if (form.password.length < 8)
            next.password = "Password must be at least 8 characters.";

        if (form.password !== form.confirmPassword)
            next.confirmPassword = "Passwords do not match.";

        setFieldErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;

        setBusy(true);
        try {
            await registerRequest(
                form.email,
                form.email, // username = email
                form.firstName.trim(),
                form.lastName.trim(),
                form.password
            );

            navigate("/signin", {
                replace: true,
                state: { registered: true },
            });
        } catch (err) {
            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors((p) => mergeFieldErrors(p, appErr));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
            <div className="w-full max-w-sm">
                {/* Branding */}
                <div className="text-center text-white mb-6">
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-500">
                        OVM
                    </h1>
                    <p className="text-gray-300 text-sm mt-1">
                        Secure Online Voting System
                    </p>
                </div>

                <div className="rounded-2xl bg-gray-800/90 p-6 shadow-2xl border border-gray-700">
                    <h2 className="text-center text-xl font-bold text-white">
                        Create Account
                    </h2>
                    <p className="text-center text-xs text-gray-400 mt-1">
                        Register to start voting
                    </p>

                    <ErrorBanner
                        error={error}
                        onClose={() => setError(null)}
                        className="mt-4"
                    />

                    <form onSubmit={onSubmit} className="mt-5 space-y-4">
                        {/* First name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                First Name
                            </label>
                            <input
                                name="firstName"
                                type="text"
                                value={form.firstName}
                                onChange={onChange}
                                className={[
                                    "mt-1 block w-full rounded-lg border bg-gray-900 px-3 py-2 text-gray-100",
                                    fieldErrors.firstName ? "border-red-500/50" : "border-gray-600",
                                ].join(" ")}
                            />
                            <InlineFieldError message={fieldErrors.firstName} />
                        </div>

                        {/* Last name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Last Name
                            </label>
                            <input
                                name="lastName"
                                type="text"
                                value={form.lastName}
                                onChange={onChange}
                                className={[
                                    "mt-1 block w-full rounded-lg border bg-gray-900 px-3 py-2 text-gray-100",
                                    fieldErrors.lastName ? "border-red-500/50" : "border-gray-600",
                                ].join(" ")}
                            />
                            <InlineFieldError message={fieldErrors.lastName} />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Email Address
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onChange}
                                className={[
                                    "mt-1 block w-full rounded-lg border bg-gray-900 px-3 py-2 text-gray-100",
                                    fieldErrors.email ? "border-red-500/50" : "border-gray-600",
                                ].join(" ")}
                            />
                            <InlineFieldError message={fieldErrors.email} />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={onChange}
                                className={[
                                    "mt-1 block w-full rounded-lg border bg-gray-900 px-3 py-2 text-gray-100",
                                    fieldErrors.password ? "border-red-500/50" : "border-gray-600",
                                ].join(" ")}
                            />
                            <InlineFieldError message={fieldErrors.password} />
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Confirm Password
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={onChange}
                                className={[
                                    "mt-1 block w-full rounded-lg border bg-gray-900 px-3 py-2 text-gray-100",
                                    fieldErrors.confirmPassword
                                        ? "border-red-500/50"
                                        : "border-gray-600",
                                ].join(" ")}
                            />
                            <InlineFieldError message={fieldErrors.confirmPassword} />
                        </div>

                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
                        >
                            {busy ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs text-gray-400">
                        Already registered?{" "}
                        <Link to="/signin" className="font-semibold text-indigo-400">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

