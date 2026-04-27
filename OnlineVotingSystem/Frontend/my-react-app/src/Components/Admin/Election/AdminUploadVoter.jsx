// src/Components/Admin/Election/AdminUploadVoters.jsx
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, FileText, X, ArrowLeft } from "lucide-react";
import { OVS } from "../../../Service/Api/endpoints";
import { useAppStore } from "../../../Service/GlobalState/appStore";
import { toAppError } from "../../../Service/ErrorHandling/appError";
import AdminLayout from "../../../components/layout/AdminLayout";
import {
    Panel, FormGroup, Input, Btn, ErrorBanner, SuccessBanner, HintBox,
} from "../../ui";

export default function AdminUploadVoters() {
    const { electionId }  = useParams();
    const navigate         = useNavigate();
    const election         = useAppStore(s => s.election);
    const fileRef          = useRef(null);

    const [file, setFile]           = useState(null);
    const [voterIdCol, setVoterIdCol] = useState("voterId");
    const [emailCol,   setEmailCol]   = useState("email");
    const [dragging,   setDragging]   = useState(false);
    const [uploading,  setUploading]  = useState(false);
    const [progress,   setProgress]   = useState(0);
    const [error,      setError]      = useState(null);
    const [report,     setReport]     = useState(null); // ImportReport

    function pickFile(f) {
        if (!f || !f.name.endsWith(".csv")) {
            setError({ title: "Invalid file", message: "Only .csv files are accepted." });
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            setError({ title: "File too large", message: "Maximum file size is 10 MB." });
            return;
        }
        setFile(f); setError(null); setReport(null); setProgress(0);
    }

    function onDrop(e) {
        e.preventDefault(); setDragging(false);
        pickFile(e.dataTransfer?.files?.[0]);
    }

    async function doUpload() {
        if (!file || !electionId) return;
        setError(null); setReport(null); setProgress(0); setUploading(true);

        // Simulate progress while uploading
        const tick = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 180);

        try {
            const fd = new FormData();
            fd.append("file",          file);
            fd.append("voterIdColumn", voterIdCol);
            fd.append("emailColumn",   emailCol);

            // POST /admin/election/upload/voters?electionId=
            const res = await OVS.uploadVoters({ electionId, formData: fd });
            clearInterval(tick); setProgress(100);

            if (!res.ok) { setError(toAppError(res)); return; }
            setReport(res.data); // ImportReport { jobId, status, errorFilePath }
        } catch (err) {
            clearInterval(tick);
            setError(toAppError(err));
        } finally {
            clearInterval(tick);
            setUploading(false);
        }
    }

    const isDraft  = String(election?.status || "").toLowerCase() === "draft";
    const fileName = file?.name;
    const fileSize = file ? `${(file.size / 1024).toFixed(0)} KB` : "";

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin",      path: "/admin" },
                { label: "Elections",  path: "/admin/elections/status?status=draft" },
                { label: election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Upload Voters" },
            ]}
            topbarRight={
                <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                    <ArrowLeft size={12} /> Workspace
                </Btn>
            }
        >
            <div className="animate-up">
                <div className="flex items-center gap-2 mb-1">
                    <Upload size={15} style={{ color: "var(--purple)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--t3)" }}>Admin · Election · Upload Voters</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>Upload Voters CSV</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    Import eligible voter list for <strong style={{ color: "var(--t2)" }}>{election?.name || electionId}</strong>
                </p>
            </div>

            {!isDraft && (
                <HintBox type="warning" className="animate-up">
                    Voter uploads are only allowed in <strong style={{ color: "var(--t1)" }}>draft</strong> status.
                    Current status: <strong style={{ textTransform: "uppercase", color: "var(--orange)" }}>{election?.status || "unknown"}</strong>.
                </HintBox>
            )}

            <div className="grid gap-4 animate-up-2" style={{ gridTemplateColumns: "1fr 260px" }}>
                <Panel title="Upload File" subtitle="POST /admin/election/upload/voters?electionId=">
                    {report?.status === "COMPLETED" && (
                        <SuccessBanner
                            title="Import completed"
                            message={`Job ${report.jobId} · status: ${report.status}`}
                            onClose={() => setReport(null)}
                        />
                    )}
                    {report?.status && report.status !== "COMPLETED" && (
                        <HintBox type="warning">
                            Job <span className="mono">{report.jobId}</span> status: <strong style={{ color: "var(--t1)" }}>{report.status}</strong>
                            {report.errorFilePath && (
                                <span> · Error file: <span className="mono">{report.errorFilePath}</span></span>
                            )}
                        </HintBox>
                    )}
                    <ErrorBanner error={error} onClose={() => setError(null)} />

                    <div className="flex flex-col gap-4 mt-3">
                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            onClick={() => isDraft && fileRef.current?.click()}
                            className="flex flex-col items-center text-center rounded-xl py-9 px-6 transition-all"
                            style={{
                                border: `2px dashed ${dragging ? "var(--purple)" : "var(--border)"}`,
                                background: dragging ? "var(--purple-d)" : "transparent",
                                cursor: isDraft ? "pointer" : "not-allowed",
                                opacity: isDraft ? 1 : .5,
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
                                Drop your CSV here or click to browse
                            </div>
                            <div style={{ fontSize: 12, color: "var(--t3)" }}>Accepts .csv files only · Max 10 MB</div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv"
                                style={{ display: "none" }}
                                onChange={e => pickFile(e.target.files?.[0])}
                                disabled={!isDraft}
                            />
                        </div>

                        {/* File pill */}
                        {file && (
                            <div
                                className="flex items-center gap-3 rounded-xl px-4 py-3"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                            >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                     style={{ background: "var(--green-d)", color: "var(--green)" }}>
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</div>
                                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{fileSize}</div>
                                </div>
                                <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                                        style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer" }}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Column mapping */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormGroup label="Voter ID Column" required
                                       hint="The column header in your CSV that contains voter IDs">
                                <Input value={voterIdCol} onChange={e => setVoterIdCol(e.target.value)}
                                       placeholder="voterId" disabled={!isDraft} />
                            </FormGroup>
                            <FormGroup label="Email Column" required
                                       hint="The column header in your CSV that contains emails">
                                <Input value={emailCol} onChange={e => setEmailCol(e.target.value)}
                                       placeholder="email" disabled={!isDraft} />
                            </FormGroup>
                        </div>

                        {/* Progress */}
                        {uploading && (
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span style={{ fontSize: 12, color: "var(--t2)" }}>Importing…</span>
                                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>{progress}%</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", borderRadius: 4, width: `${progress}%`, background: "linear-gradient(90deg, var(--purple), var(--cyan))", transition: "width .3s ease" }} />
                                </div>
                            </div>
                        )}

                        <Btn
                            variant="primary" size="lg" className="w-full"
                            disabled={!file || !isDraft}
                            loading={uploading}
                            onClick={doUpload}
                        >
                            {uploading ? "Uploading…" : "↑ Upload & Import"}
                        </Btn>
                    </div>
                </Panel>

                <div className="flex flex-col gap-3">
                    <Panel title="Expected CSV Format">
                        <p style={{ fontSize: 11.5, color: "var(--t2)", marginBottom: 10 }}>Your CSV must include these columns:</p>
                        <pre style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--cyan)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", lineHeight: 1.8 }}>
{`voterId,email
LSBU-1001,alice@lsbu.ac.uk
LSBU-1002,bob@lsbu.ac.uk
LSBU-1003,cara@lsbu.ac.uk`}
            </pre>
                        <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 8 }}>
                            Column names are configurable — map them in the fields on the left.
                        </p>
                    </Panel>

                    <Panel title="Election Status">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                                <span style={{ fontSize: 12, color: "var(--t2)" }}>Name</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>{election?.name || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ fontSize: 12, color: "var(--t2)" }}>Status</span>
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                    background: isDraft ? "var(--green-d)" : "var(--orange-d)",
                                    color: isDraft ? "var(--green)" : "var(--orange)",
                                    border: `1px solid ${isDraft ? "var(--green-b)" : "rgba(247,166,77,.25)"}`,
                                }}>
                  {election?.status?.toUpperCase() || "—"}
                </span>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </AdminLayout>
    );
}


// ─── AdminUploadCandidates ────────────────────────────────────────────────────
export function AdminUploadCandidates() {
    const { electionId }  = useParams();
    const navigate         = useNavigate();
    const election         = useAppStore(s => s.election);
    const fileRef          = useRef(null);

    const [file, setFile]         = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError]       = useState(null);
    const [report, setReport]     = useState(null);

    function pickFile(f) {
        if (!f?.name.endsWith(".csv")) { setError({ message: "Only .csv files accepted." }); return; }
        if (f.size > 10 * 1024 * 1024) { setError({ message: "Max 10 MB." }); return; }
        setFile(f); setError(null); setReport(null); setProgress(0);
    }

    async function doUpload() {
        if (!file || !electionId) return;
        setError(null); setProgress(0); setUploading(true);
        const tick = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 180);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await OVS.uploadCandidates({ electionId, formData: fd });
            clearInterval(tick); setProgress(100);
            if (!res.ok) { setError(toAppError(res)); return; }
            setReport(res.data);
        } catch (err) {
            clearInterval(tick); setError(toAppError(err));
        } finally {
            clearInterval(tick); setUploading(false);
        }
    }

    const isDraft = String(election?.status || "").toLowerCase() === "draft";

    return (
        <AdminLayout
            breadcrumbs={[
                { label: "Admin", path: "/admin" },
                { label: election?.name || electionId, path: `/admin/elections/${electionId}` },
                { label: "Upload Candidates" },
            ]}
            topbarRight={
                <Btn variant="ghost" size="sm" onClick={() => navigate(`/admin/elections/${electionId}`)}>
                    <ArrowLeft size={12} /> Workspace
                </Btn>
            }
        >
            <div className="animate-up">
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>Upload Candidates CSV</h1>
                <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>
                    Import candidates for <strong style={{ color: "var(--t2)" }}>{election?.name || electionId}</strong>
                </p>
            </div>

            {!isDraft && <HintBox type="warning" className="animate-up">Candidate uploads are only allowed in <strong style={{ color: "var(--t1)" }}>draft</strong> status.</HintBox>}

            <div className="grid gap-4 animate-up-2" style={{ gridTemplateColumns: "1fr 260px" }}>
                <Panel title="Upload File" subtitle="POST /admin/election/upload/candidates?electionId=">
                    {report && <SuccessBanner title="Import complete" message={`Job ${report.jobId} · ${report.status}`} onClose={() => setReport(null)} />}
                    <ErrorBanner error={error} onClose={() => setError(null)} />
                    <div className="flex flex-col gap-4 mt-3">
                        <div
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer?.files?.[0]); }}
                            onClick={() => isDraft && fileRef.current?.click()}
                            className="flex flex-col items-center text-center rounded-xl py-9 px-6 transition-all"
                            style={{ border: `2px dashed ${dragging ? "var(--purple)" : "var(--border)"}`, background: dragging ? "var(--purple-d)" : "transparent", cursor: isDraft ? "pointer" : "not-allowed", opacity: isDraft ? 1 : .5 }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>Drop candidate CSV here or click to browse</div>
                            <div style={{ fontSize: 12, color: "var(--t3)" }}>Accepts .csv files only · Max 10 MB</div>
                            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => pickFile(e.target.files?.[0])} disabled={!isDraft} />
                        </div>
                        {file && (
                            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--cyan-d)", color: "var(--cyan)" }}><FileText size={16} /></div>
                                <div className="flex-1 min-w-0">
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{file.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--t3)" }}>{(file.size / 1024).toFixed(0)} KB</div>
                                </div>
                                <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer" }}><X size={16} /></button>
                            </div>
                        )}
                        {uploading && (
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span style={{ fontSize: 12, color: "var(--t2)" }}>Importing…</span>
                                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--t3)" }}>{progress}%</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", borderRadius: 4, width: `${progress}%`, background: "linear-gradient(90deg, var(--purple), var(--cyan))", transition: "width .3s ease" }} />
                                </div>
                            </div>
                        )}
                        <Btn variant="primary" size="lg" className="w-full" disabled={!file || !isDraft} loading={uploading} onClick={doUpload}>
                            {uploading ? "Uploading…" : "↑ Upload & Import"}
                        </Btn>
                    </div>
                </Panel>

                <Panel title="Expected CSV Format">
          <pre style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--cyan)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", lineHeight: 1.8, overflowX: "auto" }}>
{`firstName,lastName,party,
position,ballotSerial,
photoUrl,lineNumber

Amara,Osei-Bonsu,Unity,
President,P-001,,1`}
          </pre>
                    <HintBox type="info" className="mt-3">
                        <code>position</code> values must match exactly across all candidates to be grouped correctly.
                    </HintBox>
                </Panel>
            </div>
        </AdminLayout>
    );
}
