// src/lib/download.js
// Helper to download a blob from an authenticated endpoint. Falls back to
// a raw fetch + Bearer token if the global api handler doesn't do blob
// responses. Used by AdminResults to pull the audit bundle zip.
import { AuthToken } from "../Service/GlobalState/authToken";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function downloadBlob(path, filename) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${AuthToken.get() || ""}` },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
