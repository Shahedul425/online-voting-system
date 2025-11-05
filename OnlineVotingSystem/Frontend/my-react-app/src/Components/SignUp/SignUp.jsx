import { useState } from "react";
import {registerRequest} from "../../Service/Api/registerApi.js";
import {useNavigate} from "react-router-dom";
export default function SignUp() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            await registerRequest(
                form.email,
                form.email, // username = email
                form.firstName,
                form.lastName,
                form.password
            );

            alert("✅ Registration successful! Please login.");
            navigate("/signin");
        } catch (err) {
            setError(err.message)
            alert(err.message)
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">

            {/* Logo / Branding */}
            <div className="text-center text-white font-semibold mb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-indigo-500 drop-shadow-md">
                    OVM
                </h1>
                <p className="text-gray-300 text-sm mt-1 tracking-wide">
                    Secure Online Voting System
                </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl bg-gray-800/90 p-6 shadow-2xl backdrop-blur-md border border-gray-700">
                <h2 className="text-center text-xl font-bold text-white">
                    Create Account
                </h2>
                <p className="text-center text-xs text-gray-400 mt-1">
                    Register to start voting
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">

                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">
                            First Name
                        </label>
                        <input
                            name="firstName"
                            type="text"
                            required
                            placeholder="John"
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100"
                            onChange={handleChange}
                        />

                        {/* Last Name */}
                        <label className="block text-sm font-medium text-gray-300 mt-2">
                            Last Name
                        </label>
                        <input
                            name="lastName"
                            type="text"
                            required
                            placeholder="Doe"
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">
                            Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">
                            Confirm Password
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-1">
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mt-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-800 px-2 text-gray-400">or</span>
                        </div>
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-100"
                    >
                        Continue with Google
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-400">
                    Already registered?{" "}
                    <a href="/login" className="font-semibold text-indigo-400">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}

