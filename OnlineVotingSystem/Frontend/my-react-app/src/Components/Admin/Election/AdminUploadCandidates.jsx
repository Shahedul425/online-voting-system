import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { OVS } from "../../../Service/Api/endpoints";
import { ErrorBanner } from "../../Errors/ErrorBanner";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import { withUnwrap } from "../../../Service/Api/apiUnwrap.js";
import { Upload } from "lucide-react";

export default function AdminUploadCandidates() {
    const { electionId } = useParams();
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const canSubmit = useMemo(() => !!file && !!electionId, [file, electionId]);

    async function submit() {
        setError(null);
        setReport(null);

        if (!canSubmit) return;

        setLoading(true);
        try {
            const rep = await withUnwrap(OVS.uploadCandidates({ electionId, file }));
            setReport(rep);
        } catch (e) {
            setError(toAppError(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-10 text-white">
            <div className="mx-auto w-full max-w-2xl">
                <h1 className="text-3xl font-extrabold text-indigo-400">Upload Candidates CSV</h1>
                <p className="mt-2 text-sm text-white/60">Import candidates into staging and migrate on success.</p>

                <div className="mt-6">
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur space-y-4">
                    <div>
                        <label className="text-sm text-white/80">CSV File</label>
                        <div className="mt-2 flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400 transition">
                                <Upload size={16} /> Choose file
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            <div className="text-sm text-white/70 truncate">
                                {file ? file.name : "No file selected"}
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={!canSubmit || loading}
                        onClick={submit}
                        className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-400 transition disabled:opacity-60"
                    >
                        {loading ? "Uploading..." : "Upload & Import"}
                    </button>

                    {report && (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <div className="font-semibold text-emerald-200">Import Report</div>
                            <div className="mt-2 text-sm text-white/80">
                                Status: <span className="font-semibold">{report.status}</span>
                            </div>
                            {/*{report.jobId && <div className="mt-1 text-xs text-white/60">JobId: {report.jobId}</div>}*/}
                            {/*{report.errorFilePath && (*/}
                            {/*    <div className="mt-1 text-xs text-white/60 break-all">Error file: {report.errorFilePath}</div>*/}
                            {/*)}*/}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
