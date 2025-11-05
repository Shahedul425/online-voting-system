"use client";
import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import Img from '../assets/react.svg'
export default function Vote() {
    const [positions, setPositions] = useState([]);
    const [selectedVotes, setSelectedVotes] = useState({});
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        // Replace with backend data (Spring Boot API)
        const data = [
            {
                id: 1,
                position: "President",
                candidates: [
                    { id: 1, name: "Alice Carter", party: "Unity Party", image:Img } ,
                    { id: 2, name: "Michael Reed", party: "Forward Alliance", image: "https://via.placeholder.com/150" },
                    { id: 3, name: "Evelyn Thomas", party: "Reform Coalition", image: "https://via.placeholder.com/150" },
                    // { id: 4, name: "Michael Reed", party: "Forward Alliance", image: "https://via.placeholder.com/150" },

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
        setPositions(data);
    }, []);

    const handleVote = (positionId, candidateId) => {
        setSelectedVotes((prev) => ({ ...prev, [positionId]: candidateId }));
    };

    const submitVote = async () => {
        if (positions.some((p) => !selectedVotes[p.id])) {
            setStatusMessage("⚠️ Please select a candidate for every position.");
            return;
        }

        try {
            const res = await fetch("http://localhost:8080/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedVotes),
            });
            const result = await res.json();
            setStatusMessage(result.success ? "✅ Vote submitted successfully!" : "❌ Submission failed.");
        } catch {
            setStatusMessage("⚠️ Network or server error. Please try again.");
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center py-8 px-2 sm:px-4 text-white">
            {/* Header */}
            <div className="w-full text-center mb-4 opacity-80">
                <h1 className="text-lg font-semibold text-indigo-400 tracking-tight">OVM</h1>
                <p className="text-xs text-gray-400">Vote With Ease</p>
            </div>

            {/* Main Card */}
            <div
                className="w-full max-w-6xl bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl px-6 sm:px-10 py-10 space-y-10">
                <div className="text-center mb-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-indigo-300">Select Your Candidates</h2>
                    <p className="text-sm text-gray-400 mt-1">Please choose one candidate for each position.</p>
                </div>

                {positions.map((pos) => (
                    <div
                        key={pos.id}
                        className="border border-gray-700 shadow-sm rounded-xl py-8 px-2 sm:px-6 bg-gray-900/60 hover:bg-gray-800/60 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-100">{pos.position}</h3>
                            {selectedVotes[pos.id] && (
                                <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                    <CheckCircle2 size={18}/> Selected
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {pos.candidates.map((c) => {
                                const selected = selectedVotes[pos.id] === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => handleVote(pos.id, c.id)}
                                        className={`relative cursor-pointer rounded-xl overflow-hidden border transition-all duration-300 ${
                                            selected
                                                ? "border-green-500 bg-green-950/30 ring-1 ring-green-400"
                                                : "border-gray-700 bg-gray-900 hover:border-indigo-400"
                                        }`}
                                    >
                                        <img src={c.image} alt={c.name}
                                             className="w-full h-40 object-cover opacity-90"/>
                                        <div className="p-4 text-center">
                                            <h4 className="text-gray-100 font-semibold text-base">{c.name}</h4>
                                            <p className="text-sm text-gray-400">{c.party}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="text-center">
                    <p className="text-xs text-gray-500 mb-3">Review your selections before submitting.</p>
                    <button
                        onClick={submitVote}
                        className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all duration-200"
                    >
                        Finalize & Submit Vote
                    </button>
                    {statusMessage && <p className="text-gray-400 text-sm mt-3">{statusMessage}</p>}
                </div>
            </div>
        </div>

    );
}

