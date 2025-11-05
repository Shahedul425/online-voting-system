"use client";
import { useState, useRef, useEffect } from "react";

export default function Verification() {
    const [step, setStep] = useState(1);
    const [studentId, setStudentId] = useState("");
    const [idImage, setIdImage] = useState(null);
    const [selfieImage, setSelfieImage] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // camera control
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            alert("Please allow camera access to continue verification.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    useEffect(() => {
        if (step === 2 || step === 3) startCamera();
        return () => stopCamera();
    }, [step]);

    // Capture function
    const capturePhoto = (type) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/png");

        if (type === "id") {
            setIdImage(imageData);
            stopCamera();
        } else if (type === "selfie") {
            setSelfieImage(imageData);
            stopCamera();
        }
        setStatusMessage("");
    };

    // Retry resets photo & restarts camera
    const retryCapture = (type) => {
        if (type === "id") setIdImage(null);
        if (type === "selfie") setSelfieImage(null);
        setStatusMessage("Retrying...");
        startCamera();
    };

    // Step visual
    const Step = ({ number, label, active, completed }) => (
        <div className="flex flex-col items-center relative z-10">
            <div
                className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold border-2 transition-all duration-300 ${
                    completed
                        ? "bg-green-500 border-green-500 text-white"
                        : active
                            ? "border-indigo-500 text-indigo-400"
                            : "border-gray-600 text-gray-500"
                }`}
            >
                {completed ? "✓" : number}
            </div>
            <span className="text-xs mt-2 text-gray-300">{label}</span>
        </div>
    );

    // Send to backend
    const submitVerification = async () => {
        if (!idImage || !selfieImage) {
            alert("Please complete all steps before submitting.");
            return;
        }

        setLoading(true);
        setStatusMessage("Verifying with backend...");

        try {
            const res = await fetch("http://localhost:8080/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, idImage, selfieImage }),
            });
            const result = await res.json();

            if (result.success) {
                setStatusMessage("✅ Verification Successful!");
            } else {
                setStatusMessage("❌ Verification Failed. Please retry.");
                setStep(2);
            }
        } catch {
            setStatusMessage("⚠️ Server error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
            {/* Logo */}
            <div className="text-center text-white font-semibold mb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-indigo-500 drop-shadow-md">OVM</h1>
                <p className="text-gray-300 text-sm mt-1 tracking-wide">Vote With Ease</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm rounded-2xl bg-gray-800/90 p-6 shadow-2xl backdrop-blur-md border border-gray-700 space-y-6">

                {/* Step Progress Bar */}
                <div className="relative flex items-center justify-between mb-4">
                    {/* background line */}
                    <div className="absolute top-[18px] left-[12%] right-[12%] h-[2px] bg-gray-700 z-0" />
                    {/* progress line */}
                    <div
                        className="absolute top-[18px] left-[12%] h-[2px] bg-green-500 z-0 transition-all duration-500"
                        style={{
                            width: step === 1 ? "0%" : step === 2 ? "38%" : "76%",
                        }}
                    />
                    {/* steps */}
                    <div className="flex justify-between w-full relative z-10">
                        <Step number={1} label="Student ID" active={step === 1} completed={step > 1} />
                        <Step number={2} label="Upload ID" active={step === 2} completed={step > 2} />
                        <Step number={3} label="Selfie" active={step === 3} completed={!!selfieImage} />
                    </div>
                </div>

                {/* Step 1 */}
                {step === 1 && (
                    <div className="text-center space-y-4">
                        <h2 className="text-white text-lg font-semibold">Enter Your Student ID</h2>
                        <input
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder="Student ID"
                            className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                        />
                        <button
                            onClick={() => setStep(2)}
                            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 font-medium shadow-md transition-all duration-200"
                        >
                            Verify ID
                        </button>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="text-center space-y-4">
                        <h2 className="text-white text-lg font-semibold">Show Your Student ID</h2>
                        {!idImage ? (
                            <>
                                <video ref={videoRef} autoPlay className="rounded-lg border border-gray-700 w-full" />
                                <canvas ref={canvasRef} className="hidden" />
                                <button
                                    onClick={() => capturePhoto("id")}
                                    className="w-full rounded-lg bg-green-600 hover:bg-green-500 text-white py-2 font-medium shadow-md transition-all duration-200"
                                >
                                    Capture ID
                                </button>
                            </>
                        ) : (
                            <>
                                <img src={idImage} alt="Captured ID" className="rounded-lg border border-gray-700 w-full" />
                                <div className="flex justify-between gap-2">
                                    <button
                                        onClick={() => retryCapture("id")}
                                        className="w-1/2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white py-2 font-medium shadow-md"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="w-1/2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 font-medium shadow-md"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="text-center space-y-4">
                        <h2 className="text-white text-lg font-semibold">Take a Live Selfie</h2>
                        {!selfieImage ? (
                            <>
                                <video ref={videoRef} autoPlay className="rounded-lg border border-gray-700 w-full" />
                                <canvas ref={canvasRef} className="hidden" />
                                <button
                                    onClick={() => capturePhoto("selfie")}
                                    className="w-full rounded-lg bg-green-600 hover:bg-green-500 text-white py-2 font-medium shadow-md transition-all duration-200"
                                >
                                    Capture Selfie
                                </button>
                            </>
                        ) : (
                            <>
                                <img src={selfieImage} alt="Captured Selfie" className="rounded-lg border border-gray-700 w-full" />
                                <div className="flex justify-between gap-2">
                                    <button
                                        onClick={() => retryCapture("selfie")}
                                        className="w-1/2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white py-2 font-medium shadow-md"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={submitVerification}
                                        className="w-1/2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 font-medium shadow-md"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Status */}
                {statusMessage && <p className="text-sm text-center text-gray-300 mt-2">{statusMessage}</p>}
                {loading && <p className="text-xs text-center text-gray-500">Processing...</p>}
            </div>
        </div>
    );
}

