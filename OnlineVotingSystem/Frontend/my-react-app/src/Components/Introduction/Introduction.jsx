"use client";
import { ShieldCheck, Vote, IdCard, CheckCircle2, HelpCircle, Clock } from "lucide-react";
import {useNavigate} from "react-router-dom";
import keycloak from "../../Service/Auth/Keycloak.js";
export default function Introduction() {
    // const handleLogin = () => {
    //     keycloak.login();
    // };
    const navigate = useNavigate();
    return (
        <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-lg font-bold">
                        OVS
                    </div>
                    <span className="font-semibold text-sm tracking-wide text-gray-200">
            Online Voting System
          </span>
                </div>

                <button onClick={()=>navigate("/signin")} className="bg-indigo-600 hover:bg-indigo-500 transition-all px-5 py-2 rounded-lg text-sm font-semibold shadow">
                    Login
                </button>
            </header>

            {/* Hero */}
            <main className="flex flex-col justify-center items-center text-center px-6 flex-grow">

                <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
                    Cast Your Vote with Confidence
                </h1>

                <p className="text-indigo-300 text-sm mt-3 font-semibold italic">
                    "Your vote. Your right. Your future."
                </p>

                <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-md">
                    Fast, secure, and transparent digital voting.
                    Your voice matters — make it count.
                </p>

                {/* Voter-focused Features */}
                <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">

                    <Feature icon={<IdCard size={28} />} title="Easy ID Verification" />
                    <Feature icon={<Vote size={28} />} title="Simple Ballot Selection" />
                    <Feature icon={<ShieldCheck size={28} />} title="Your Vote Is Secure" />
                    <Feature icon={<CheckCircle2 size={28} />} title="Instant Confirmation" />
                    <Feature icon={<HelpCircle size={28} />} title="Guided Steps" />
                    <Feature icon={<Clock size={28} />} title="No Waiting, Vote Anytime" />

                </div>
            </main>

            {/* Footer */}
            <footer className="flex flex-col items-center border-t border-white/10 py-4 text-xs text-gray-400">
                <div className="flex gap-6 mb-1">
                    <button className="hover:text-white transition">Privacy</button>
                    <button className="hover:text-white transition">Terms</button>
                    <button className="hover:text-white transition">Help</button>
                    <button className="hover:text-white transition">Contact</button>
                </div>
                <p>© {new Date().getFullYear()} OVS — Your Vote Is Protected</p>
            </footer>

        </div>
    );
}

function Feature({ icon, title }) {
    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl py-4 px-3 flex flex-col items-center justify-center hover:border-indigo-500/40 hover:bg-gray-900 transition shadow-sm">
            <div className="text-indigo-400 mb-2">{icon}</div>
            <p className="text-white font-medium text-sm text-center">{title}</p>
        </div>
    );
}
