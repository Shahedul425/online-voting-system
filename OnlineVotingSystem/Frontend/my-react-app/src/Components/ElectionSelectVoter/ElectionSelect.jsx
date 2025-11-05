"use client";
import { useState } from "react";

export default function ElectionSelect({ onSelectElection }) {
    const [selectedElection, setSelectedElection] = useState("");

    // dummy elections (replace later with API)
    const elections = [
        { id: "EL-001", name: "Student Council Election 2025", date: "2025-11-10" },
        { id: "EL-002", name: "Teacher Union Representative 2025", date: "2025-12-01" },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-4">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-indigo-500 tracking-tight">Select Election</h1>
                <p className="text-gray-400 text-sm mt-1">Choose your active election to proceed</p>
            </div>

            <div className="w-full max-w-md bg-gray-800/90 border border-gray-700 rounded-2xl shadow-2xl p-6 space-y-6 backdrop-blur-md">
                {elections.map((election) => (
                    <button
                        key={election.id}
                        onClick={() => {
                            setSelectedElection(election.id);
                            onSelectElection?.(election);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 ${
                            selectedElection === election.id
                                ? "border-indigo-500 bg-indigo-600/20"
                                : "border-gray-700 hover:border-indigo-400 hover:bg-gray-700/40"
                        }`}
                    >
                        <h3 className="text-lg font-semibold text-white">{election.name}</h3>
                        <p className="text-sm text-gray-400">ID: {election.id}</p>
                        <p className="text-xs text-gray-500 mt-1">Date: {election.date}</p>
                    </button>
                ))}

                <button
                    disabled={!selectedElection}
                    onClick={() => window.location.href = "/verification"}
                    className={`w-full py-2 rounded-lg font-semibold text-white shadow-md transition-all duration-200 ${
                        selectedElection
                            ? "bg-indigo-600 hover:bg-indigo-500"
                            : "bg-gray-700 cursor-not-allowed"
                    }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
