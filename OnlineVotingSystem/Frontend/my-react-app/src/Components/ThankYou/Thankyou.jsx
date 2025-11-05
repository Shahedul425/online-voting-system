"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

export default function ThankYou() {
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        // mock data — replace with real later
        const data = {
            transactionId: "OVM-2025-001245",
            timestamp: new Date().toLocaleString(),
            selections: [
                { position: "President", candidate: "Michael Reed", party: "Forward Alliance" },
                { position: "Vice President", candidate: "Daniel Kim", party: "Unity Party" },
            ],
        };
        setReceipt(data);
    }, []);

    const handleDownload = () => {
        const text = `
OVM Digital Vote Receipt
---------------------------------------
Transaction ID: ${receipt.transactionId}
Date: ${receipt.timestamp}

Selections:
${receipt.selections
            .map((s) => `${s.position}: ${s.candidate} (${s.party})`)
            .join("\n")}

Thank you for participating in secure voting.
    `;
        const blob = new Blob([text], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "OVM_Vote_Receipt.txt";
        link.click();
    };

    if (!receipt) return null;

    return (
        <div
            className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 text-white">
            <div
                className="w-full max-w-md sm:max-w-lg bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-700 flex flex-col justify-between h-[90vh] p-6 sm:p-8">
                <div className="flex flex-col items-center text-center space-y-1">
                    <CheckCircle2 size={48} className="text-green-400"/>
                    <h1 className="text-xl sm:text-2xl font-bold text-indigo-300">Thank You for Voting!</h1>
                    <p className="text-gray-400 text-xs sm:text-sm">Your vote has been securely recorded and
                        verified.</p>
                </div>

                <div className="flex-grow flex flex-col justify-center mt-3 mb-3">
                    <div className="bg-gray-900/70 border border-gray-700 rounded-2xl p-4 sm:p-5 text-left shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="text-[11px] text-gray-500">Transaction ID</p>
                                <p className="text-xs font-semibold text-gray-300">{receipt.transactionId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] text-gray-500">Date</p>
                                <p className="text-xs font-semibold text-gray-300">{receipt.timestamp}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-3">
                            <h3 className="text-sm font-semibold text-indigo-400 mb-2">Your Selections</h3>
                            {receipt.selections.map((sel, idx) => (
                                <div key={idx}
                                     className="flex mb-2 justify-between items-center bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 hover:border-indigo-400 transition-all duration-200">
                                    <div>
                                        <p className="text-sm font-medium text-gray-200">{sel.position}</p>
                                        <p className="text-[11px] text-gray-500">{sel.party}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-100">{sel.candidate}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-[10px] text-gray-500 mt-3 leading-tight text-center">
                            This digital receipt confirms your selections were securely recorded in the OVM ledger.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-3">
                    <button onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-sm">
                        <Download size={16}/> Download Receipt
                    </button>
                    <button onClick={() => alert('You may safely close this window.')}
                            className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium">
                        Close
                    </button>
                </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-500 text-center">
                © {new Date().getFullYear()} OVM — Secure Online Voting System
            </p>
        </div>

    );
}


