import {useState} from "react";
import {loginRequest} from "../../Service/Api/loginApi.js";
import {useNavigate} from "react-router-dom";

export default function SignIn() {
    const [username,setUsername] = useState("")
    const [password,setPassword] = useState("")
    const navigate = useNavigate();

    const submit = async (e)=>{
        e.preventDefault();
        try {
            const res = await loginRequest(username,password);
            // console.log(res)
            localStorage.setItem("accessToken", res.accessToken);
            localStorage.setItem("roles", JSON.stringify(res.roles));
            if (res.roles.includes("voter")){
                navigate("/select")
            }if(res.roles.includes("admin")){
                navigate("/admin")
            }
        }catch(err){
            console.log(err)
            alert("Invalid Login")
        }
    }
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

            {/* Sign-In Card */}
            <div className="w-full max-w-sm rounded-2xl bg-gray-800/90 p-6 shadow-2xl backdrop-blur-md border border-gray-700">
                <h2 className="text-center text-xl font-bold text-white">
                    Sign in to Vote
                </h2>
                <p className="text-center text-xs text-gray-400 mt-1">
                    Enter your registered credentials
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-300"
                        >
                            Email Address
                        </label>
                        <div className="mt-1.5">
                            <input
                                id="email"
                                name="email"
                                // type="email"
                                required
                                autoComplete="email"
                                value={username}
                                onChange={(e)=>setUsername(e.target.value)}
                                placeholder="you@example.com"
                                className="block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-300"
                            >
                                Password
                            </label>
                            <a
                                href="#"
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                                Forgot?
                            </a>
                        </div>
                        <div className="mt-1.5">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
                        >
                            Sign In
                        </button>
                    </div>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-gray-800 px-2 text-gray-400">or</span>
                    </div>
                </div>

                {/* Google Sign-In */}
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-100 shadow-sm hover:bg-gray-800 transition-all duration-200"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google logo"
                        className="w-4 h-4"
                    />
                    Sign in with Google
                </button>

                {/* Footer */}
                <p className="mt-5 text-center text-xs text-gray-400">
                    Don’t have an account?{' '}
                    <a
                        href="#"
                        className="font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
