"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function FinalVote() {
    const [positions, setPositions] = useState([]);
    const [selectedVotes, setSelectedVotes] = useState({});

    useEffect(() => {
        // Mock Data — replace with backend later
        const data = [
            {
                id: 1,
                position: "President",
                candidates: [
                    { id: 1, name: "Alice Carter", party: "Unity Party", image: "https://via.placeholder.com/150" },
                    { id: 2, name: "Michael Reed", party: "Forward Alliance", image: "https://via.placeholder.com/150" },
                    { id: 3, name: "Evelyn Thomas", party: "Reform Coalition", image: "https://via.placeholder.com/150" },
                ],
            },
            {
                id: 2,
                position: "Vice President",
                candidates: [
                    { id: 4, name: "Daniel Kim", party: "Unity Party", image: "https://via.placeholder.com/150" },
                    { id: 5, name: "Olivia Brown", party: "Forward Alliance", image: "https://via.placeholder.com/150" },
                ],
            },
        ];

        const selected = {
            1: 2, // Michael Reed
            2: 4, // Daniel Kim
        };

        setPositions(data);
        setSelectedVotes(selected);
    }, []);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center py-10 px-4 text-white">
            <div className="w-full text-center mb-6 opacity-80">
                <h1 className="text-lg font-semibold text-indigo-400 tracking-tight">OVM</h1>
                <p className="text-xs text-gray-400">Secure Voting Review</p>
            </div>

            <div
                className="w-full max-w-5xl bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl px-6 sm:px-10 py-10">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-semibold text-indigo-300">Review Your Selections</h2>
                    <p className="text-sm text-gray-400 mt-1">Please verify your selected candidates before final
                        submission.</p>
                </div>

                <div className="space-y-8">
                    {positions.map((pos) => {
                        const selectedId = selectedVotes[pos.id];
                        const candidate = pos.candidates.find((c) => c.id === selectedId);
                        return (
                            <div key={pos.id}
                                 className="bg-gray-900/70 border border-gray-700 rounded-xl p-6 hover:border-indigo-400 transition-all duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-100">{pos.position}</h3>
                                    <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                        <CheckCircle2 size={18}/> Confirmed
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                                    <img src={candidate?.image} alt={candidate?.name}
                                         className="w-28 h-28 rounded-xl object-cover border border-gray-600"/>
                                    <div className="text-center sm:text-left">
                                        <h4 className="text-gray-100 font-semibold text-lg">{candidate?.name}</h4>
                                        <p className="text-sm text-gray-400">{candidate?.party}</p>
                                        <p className="text-xs text-gray-500 mt-1">Selected for {pos.position}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
                    <button
                        className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-all duration-200 text-sm font-medium">
                        ← Go Back & Edit
                    </button>
                    <button
                        className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all duration-200 text-sm">
                        Confirm & Submit Vote
                    </button>
                </div>
            </div>
        </div>

    );
}
