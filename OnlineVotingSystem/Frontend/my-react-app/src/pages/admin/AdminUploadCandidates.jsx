/*
 * Endpoint: OVS.uploadCandidates({ electionId, file })
 *           → POST /admin/election/upload/candidate (multipart/form-data)
 * Response shape: ImportReport (same shape as voter upload).
 */
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AppShell, { Topbar, Scaffold } from "../../ui/AppShell";
import { Btn } from "../../ui/Primitives";
import Icon from "../../ui/Icon";
import { OVS } from "../../Service/Api/endpoints";
import { withUnwrap } from "../../Service/Api/apiUnwrap";

export default function AdminUploadCandidates() {
  const { id: electionId } = useParams();
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!file) { setError("Pick a CSV file first."); return; }
    setError(""); setReport(null); setBusy(true);
    try {
      const r = await withUnwrap(OVS.uploadCandidates({ electionId, file }));
      setReport(r || { inserted: 0, skipped: 0, errors: [] });
    } catch (e) {
      setError(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell role="admin" active="/admin/elections">
      <Topbar
        title="Upload candidates"
        crumbs={[{label:"Elections",path:"/admin/elections"},{label:electionId?.slice(0,8),path:`/admin/elections/${electionId}`},{label:"Upload candidates"}]}
      />
      <Scaffold>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl grad-soft coral flex items-center justify-center shrink-0"><Icon name="user-round" className="w-6 h-6" /></div>
              <div className="flex-1">
                <div className="display text-lg font-semibold mb-1">CSV candidate list</div>
                <p className="ink-2 text-sm">Columns required: <span className="mono">position</span>, <span className="mono">full_name</span>, <span className="mono">ballot_serial</span>. Optional: <span className="mono">photo_url</span>.</p>
              </div>
            </div>

            <label className="block mt-4">
              <div className="text-[10px] ink-3 uppercase tracking-widest mb-1">CSV file</div>
              <div className="card p-6 border-2 border-dashed text-center cursor-pointer" style={{ borderColor: "var(--hairline)" }}>
                <input type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="csv-input-candidates" />
                <label htmlFor="csv-input-candidates" className="cursor-pointer">
                  <Icon name="upload-cloud" className="w-8 h-8 coral mx-auto mb-2" />
                  <div className="font-semibold text-sm">{file ? file.name : "Click to choose a CSV"}</div>
                  <div className="text-xs ink-3 mt-1">{file ? `${(file.size/1024).toFixed(1)} KB` : "One row per candidate"}</div>
                </label>
              </div>
            </label>

            {error && <div className="mt-3 text-sm" style={{ color: "var(--coral)" }}>{error}</div>}

            <div className="flex gap-2 mt-4">
              <Btn variant="primary" onClick={submit} disabled={busy || !file}>
                <Icon name={busy?"loader-2":"upload"} className={`w-4 h-4 ${busy?"animate-spin":""}`} />
                {busy ? "Uploading…" : "Upload CSV"}
              </Btn>
              <Btn variant="ghost" onClick={() => nav(`/admin/elections/${electionId}`)}>Cancel</Btn>
            </div>
          </div>

          {report && <ImportReportCard report={report} viewListPath={`/admin/elections/${electionId}/candidates`} viewListLabel="View candidate list" onReset={() => { setReport(null); setFile(null); }} />}
        </div>
      </Scaffold>
    </AppShell>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[10px] ink-3 uppercase tracking-widest">{label}</div>
      <div className={`display text-2xl font-semibold mt-1 ${tone==="coral"?"coral":""}`}>{value}</div>
    </div>
  );
}

/**
 * Backend ImportReport returns { jobId, status, errorFilePath } only — Spring
 * Batch is async, so per-row counts aren't available at HTTP response time.
 * Render what we DO know and explain that the actual import is running in
 * the background, with a refresh CTA pointing at the live list.
 */
function ImportReportCard({ report, viewListPath, viewListLabel, onReset }) {
  const status   = String(report?.status || "").toUpperCase();
  const jobId    = report?.jobId || "—";
  const finished = status === "COMPLETED";
  const failed   = status === "FAILED" || status === "ABANDONED";

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon
          name={failed ? "alert-triangle" : finished ? "check-circle-2" : "loader-2"}
          className={`w-5 h-5 coral ${!finished && !failed ? "animate-spin" : ""}`}
        />
        <div className="display text-base font-semibold">
          {failed ? "Import failed" : finished ? "Import complete" : "Import running"}
        </div>
      </div>

      <p className="text-sm ink-2 mb-4">
        {failed
          ? "The job stopped before finishing. Check Loki / Grafana for the row-level errors."
          : finished
            ? "All eligible rows have been imported. Refresh the list below to see the results."
            : "The CSV is being processed in the background. You can come back to this election in a moment — the badge on the workspace will flip once it's done."}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Job status" value={status || "PENDING"} tone={failed ? undefined : "coral"} />
        <Stat label="Job id" value={String(jobId).slice(0, 8) + (String(jobId).length > 8 ? "…" : "")} />
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <Btn variant="primary" onClick={() => onReset?.()}>
          <Icon name="upload" className="w-4 h-4" /> Upload another file
        </Btn>
        {viewListPath && (
          <Link to={viewListPath} className="btn btn-ghost">
            <Icon name="list" className="w-4 h-4" /> {viewListLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
