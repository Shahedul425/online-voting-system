import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Upload,
    Users,
    UserCheck,
    BarChart2,
    ShieldCheck,
    LogOut,
    PlusCircle,
    Trash2,
    CheckCircle2,
    Archive,
    ListChecks,
} from "lucide-react";

export default function AdminPanel() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileUpload = (type, e) => {
        setSelectedFile(e.target.files[0]);
        alert(`${type} file uploaded: ${e.target.files[0].name}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center text-white px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-indigo-500 tracking-tight">OVM Admin</h1>
                <p className="text-gray-400 text-sm mt-1">Manage Elections, Voters, and Results</p>
            </div>

            <div className="w-full max-w-5xl bg-gray-800/90 border border-gray-700 rounded-2xl shadow-2xl p-8 space-y-10">

                {/* Election Controls */}
                <h2 className="text-xl font-semibold mb-4 text-indigo-400 border-b border-gray-700 pb-2 text-center">
                    🗳️ Election Controls
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-8">
                    <button
                        onClick={() => navigate("/admin/elections/create")}
                        className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-5 shadow border border-gray-700 hover:border-indigo-400"
                    >
                        <PlusCircle size={28} />
                        <span className="font-semibold text-sm">Create Election</span>
                    </button>

                    <button
                        onClick={() => navigate("/admin/elections/active")}
                        className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-5 shadow border border-gray-700 hover:border-indigo-400"
                    >
                        <ListChecks size={28} />
                        <span className="font-semibold text-sm">Current Elections</span>
                    </button>

                    <button
                        onClick={() => navigate("/admin/elections/archived")}
                        className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-5 shadow border border-gray-700 hover:border-indigo-400"
                    >
                        <Archive size={28} />
                        <span className="font-semibold text-sm">Archived Elections</span>
                    </button>
                </div>

                {/* Election Operations */}
                <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-400 text-center">
                        Election Operations
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        <button className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-5 shadow border border-gray-700 hover:border-indigo-400">
                            <Users size={28} />
                            <span>View Voter List</span>
                        </button>

                        <button className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-5 shadow border border-gray-700 hover:border-indigo-400">
                            <UserCheck size={28} />
                            <span>View Candidate List</span>
                        </button>

                        <button className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-indigo-600 transition rounded-xl py-5 shadow border border-gray-700 hover:border-indigo-400">
                            <BarChart2 size={28} />
                            <span>View Results</span>
                        </button>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-400 text-center">
                        Upload Data Files
                    </h2>

                    <div className="flex flex-col sm:flex-row justify-around gap-6">
                        {/* Voters */}
                        <div className="bg-gray-900 rounded-xl p-5 w-full sm:w-1/2 border border-gray-700 hover:border-indigo-400 transition">
                            <h3 className="text-center mb-3 text-sm font-medium">Upload Voter List</h3>
                            <label className="flex items-center justify-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                                <Upload size={18} /> Upload
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload("Voter List", e)} />
                            </label>
                        </div>

                        {/* Candidates */}
                        <div className="bg-gray-900 rounded-xl p-5 w-full sm:w-1/2 border border-gray-700 hover:border-indigo-400 transition">
                            <h3 className="text-center mb-3 text-sm font-medium">Upload Candidate List</h3>
                            <label className="flex items-center justify-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                                <Upload size={18} /> Upload
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload("Candidate List", e)} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 pt-6 flex flex-col items-center text-center">
                    <ShieldCheck size={32} className="text-green-500 mb-2" />
                    <p className="text-xs text-gray-400 w-3/4">
                        All actions are logged securely.
                    </p>
                </div>

                <div className="flex justify-center pt-4 border-t border-gray-700">
                    <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 transition mt-2">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
