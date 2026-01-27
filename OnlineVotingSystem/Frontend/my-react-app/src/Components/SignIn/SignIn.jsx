import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { OVS } from "../../Service/Api/endpoints";
import { useAppStore } from "../../Service/GlobalState/appStore";
import { toAppError } from "../../Service/ErrorHandling/appError";
import { ErrorBanner } from "../Errors/ErrorBanner";
import { InlineFieldError } from "../Errors/InFieldError";
import { mergeFieldErrors } from "../../Service/Api/formErrorHelpers";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignIn() {
    const navigate = useNavigate();
    const location = useLocation();

    const setMe = useAppStore((s) => s.setMe);
    const clearMe = useAppStore((s) => s.clearMe);

    const [form, setForm] = useState({ email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // const redirectTo = useMemo(
    //     () => location.state?.from?.pathname || "/dashboard",
    //     [location.state]
    // );

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setError(null);
        setFieldErrors((p) => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const next = {};
        if (!form.email.trim()) next.email = "Email is required.";
        else if (!isValidEmail(form.email.trim()))
            next.email = "Enter a valid email.";

        if (!form.password) next.password = "Password is required.";

        setFieldErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;

        setBusy(true);
        try {
            // 1️⃣ LOGIN (PUBLIC)
            const loginRes = await withUnwrap(
                OVS.login({
                    email: form.email.trim(),
                    password: form.password,
                })
            );

            // 2️⃣ STORE TOKEN (CRITICAL)
            if (!loginRes?.accessToken) {
                throw {
                    message: "Authentication failed: no access token returned.",
                    status: 401,
                };
            }
            sessionStorage.setItem("access_token", loginRes.accessToken);
            console.log(loginRes.accessToken)

            // 3️⃣ FETCH CURRENT USER
            const me = await withUnwrap(OVS.me());
            setMe(me);
             console.log(me)
            console.log("l"+ sessionStorage.getItem("access_token"))
            console.log("STORE AFTER setMe:", useAppStore.getState());
            // after you fetched /user/me and did setMe(me)
            const from = location.state?.from?.pathname;
// role-based default
            let defaultRoute;
            if(String(me?.role).toLowerCase() === "admin"){
                defaultRoute = "/admin";
            }else if(String(me?.role).toLowerCase()=== "superadmin"){
                defaultRoute = "/superadmin"
            }else{
                defaultRoute = "/select"
            }

// if user was trying to visit something before login, go back there
            navigate(from || defaultRoute, { replace: true });
        }catch (err) {
            clearMe();
            sessionStorage.removeItem("access_token");

            const appErr = toAppError(err);
            setError(appErr);
            setFieldErrors((p) => mergeFieldErrors(p, appErr));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10">
            <div className="mx-auto w-full max-w-md">
                {/* Branding */}
                <div className="text-center text-white mb-6">
                    <div className="inline-flex items-center justify-center rounded-2xl bg-indigo-600/15 px-4 py-2 border border-indigo-500/20">
            <span className="text-indigo-400 font-extrabold tracking-tight text-2xl">
              OVM
            </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">
                        Secure Online Voting System
                    </p>
                </div>

                <div className="rounded-2xl bg-gray-900/70 backdrop-blur border border-gray-800 shadow-2xl">
                    <div className="p-6 sm:p-7">
                        <h1 className="text-xl font-semibold text-white">Sign in</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Enter your email and password.
                        </p>

                        <ErrorBanner
                            error={error}
                            onClose={() => setError(null)}
                            className="mt-4"
                        />

                        <form onSubmit={onSubmit} className="mt-6 space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-200">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={onChange}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className={[
                                        "mt-1 block w-full rounded-xl border bg-gray-950/40 px-3 py-2.5 text-gray-100",
                                        "focus:outline-none focus:ring-2 focus:ring-indigo-500/70",
                                        fieldErrors.email
                                            ? "border-red-500/50"
                                            : "border-gray-800",
                                    ].join(" ")}
                                />
                                <InlineFieldError message={fieldErrors.email} />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-200">
                                    Password
                                </label>
                                <div
                                    className={[
                                        "mt-1 flex items-center rounded-xl border bg-gray-950/40",
                                        fieldErrors.password
                                            ? "border-red-500/50"
                                            : "border-gray-800",
                                        "focus-within:ring-2 focus-within:ring-indigo-500/70",
                                    ].join(" ")}
                                >
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={onChange}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="w-full bg-transparent px-3 py-2.5 text-gray-100 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white"
                                    >
                                        {showPassword ? "HIDE" : "SHOW"}
                                    </button>
                                </div>
                                <InlineFieldError message={fieldErrors.password} />
                            </div>

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
                            >
                                {busy ? "Signing in..." : "Sign in"}
                            </button>

                            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                                <span>Don’t have an account?</span>
                                <Link
                                    to="/signup"
                                    className="font-semibold text-indigo-400 hover:text-indigo-300"
                                >
                                    Create one
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="border-t border-gray-800 px-6 sm:px-7 py-4 text-xs text-gray-500">
                        If you contact support, share the Reference ID shown above.
                    </div>
                </div>
            </div>
        </div>
    );
}
