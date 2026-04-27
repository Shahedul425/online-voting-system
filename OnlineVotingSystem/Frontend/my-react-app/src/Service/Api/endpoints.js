// src/Service/Api/endpoints.js
// -----------------------------------------------------------------------------
// Drop-in replacement for Frontend/my-react-app/src/Service/Api/endpoints.js
// Adds three new endpoints required by the warm-trust JSX:
//   - liveAuditFeed       (GET /admin/election/liveAuditFeed/{electionId})
//   - getVoterElectionById(GET /voter/election/ElectionById/{id})
//   - downloadAuditBundle (GET /admin/election/{id}/auditBundle.zip as blob)
// Everything else is preserved from the prior version.
// -----------------------------------------------------------------------------
import { api } from "./GlobalApiHandler.js";

export const OVS = {
    // ============================ AUTH ======================================
    login: ({ email, password }) =>
        api.post("/public/auth/login", {
            requiresAuth: false,
            json: { username: email, password },
        }),

    register: (payload) =>
        api.post("/public/auth/register", {
            requiresAuth: false,
            json: payload,
        }),

    // Password-reset flow. Backend endpoints may not exist yet; the
    // frontend swallows errors in ForgotPassword (enumeration-safe UX)
    // and surfaces errors in ResetPassword.
    forgotPassword: ({ email }) =>
        api.post("/public/auth/forgot-password", {
            requiresAuth: false,
            json: { email },
        }),

    resetPassword: ({ token, password }) =>
        api.post("/public/auth/reset-password", {
            requiresAuth: false,
            json: { token, password },
        }),

    // "Contact us / request your org" — fires from SignUp (on org-not-found)
    // or directly from /request-org. Backend may mail the form or persist
    // it to a contact-leads table; frontend soft-fails.
    requestOrg: (payload) =>
        api.post("/public/contact/request-org", {
            requiresAuth: false,
            json: payload,
        }),

    me: () => api.get("/user/me", { requiresAuth: true }),

    // ============================ ELECTIONS =================================
    createElection: (payload) => api.post("/admin/election/create", { json: payload }),

    updateElection: ({ id, payload }) =>
        api.post("/admin/election/update", { query: { id }, json: payload }),

    startElection:   ({ id }) => api.post(`/admin/election/start/${id}`,   {}),
    stopElection:    ({ id }) => api.post(`/admin/election/stop/${id}`,    {}),
    closeElection:   ({ id }) => api.post(`/admin/election/close/${id}`,   {}),
    publishElection: ({ id }) => api.post(`/admin/election/publish/${id}`, {}),

    getElectionById:            ({ id })    => api.get(`/admin/election/ElectionById/${id}`, {}),
    getActiveElections:         ({ orgId }) => api.get(`/admin/election/ActiveElections/${orgId}`, {}),
    getAllElections:            ({ orgId }) => api.get(`/admin/election/all/${orgId}`, {}),
    getVoterAllActiveElections: ({ orgId }) => api.get(`/voter/election/ActiveElections/${orgId}`, {}),
    // NEW — voter-scoped single-election lookup. Voter pages should use this instead of
    // calling the admin path. Backend: VoterElectionController.getElectionById().
    getVoterElectionById:       ({ id })    => api.get(`/voter/election/ElectionById/${id}`, {}),

    getElectionByStatus: ({ status, orgId }) =>
        api.get(`/admin/election/ElectionByStatus`, { query: { status, orgId } }),

    getVoterListByElection: ({ electionId }) => api.get(`/admin/election/VoterListByElection/${electionId}`, {}),
    getVoterCandidates:     ({ electionId }) => api.get(`/voter/election/AllCandidate/${electionId}`, {}),
    getCandidates:          ({ electionId }) => api.get(`/admin/election/AllCandidate/${electionId}`, {}),
    totalVoters:            ({ electionId }) => api.get(`/admin/election/TotalVoterByElection/${electionId}`, {}),
    totalCandidates:        ({ electionId }) => api.get(`/admin/election/TotalCandidateByElection/${electionId}`, {}),

    // ============================ VOTE FLOW =================================
    castVoteBallot: (payload) => api.post(`/voter/vote/cast`, { json: payload }),
    verifyVoter:    ({ voterId, electionId }) =>
        api.post(`/voter/verification/verify`, { query: { voterId, electionId } }),
    // Email-driven flow: backend resolves the voter row from the JWT email,
    // so the UI doesn't need to ask for a voter-list ID.
    verifyMe:       ({ electionId }) =>
        api.post(`/voter/verification/verifyMe`, { query: { electionId } }),

    // ============================ UPLOADS ===================================
    uploadVoters: ({ electionId, voterIdColumn, emailColumn, file }) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("electionId", electionId);
        fd.append("voterIdColumn", voterIdColumn);
        fd.append("emailColumn", emailColumn);
        return api.post("/admin/election/upload/voters", { formData: fd });
    },

    uploadCandidates: ({ electionId, file }) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("electionId", electionId);
        return api.post("/admin/election/upload/candidate", { formData: fd });
    },

    // ============================ AUDIT =====================================
    auditSearch: (payload) => api.post("/audit/search", { json: payload }),
    auditGetOne: ({ electionId, auditId }) => api.get(`/audit/${electionId}/${auditId}`, {}),

    // NEW — lightweight live-audit feed for the AdminLiveTurnout page. Polls every
    // 3s; the JSX diffs by id and only prepends new rows.
    // Backend: AdminLiveAuditController (new) → GET /admin/election/liveAuditFeed/{id}
    liveAuditFeed: ({ electionId, limit = 30 }) =>
        api.get(`/admin/election/liveAuditFeed/${electionId}`, { query: { limit } }),

    // ============================ RECEIPT / MERKLE ==========================
    verifyReceipt: ({ receiptToken }) =>
        api.post("/public/receipt/verify", {
            requiresAuth: false,
            json: { receiptToken },
        }),

    // ============================ RESULTS ===================================
    getAdminElectionResults: ({ electionId }) =>
        api.get(`/admin/election/results/${electionId}`, {}),

    // NEW — ZIP blob with election.json + ballots.csv + merkle-root.txt + audit-log.csv.
    // Backend: AdminAuditBundleController (new) → GET /admin/election/{id}/auditBundle.zip
    // NB: this returns a Blob, not JSON. GlobalApiHandler's `responseType: 'blob'`
    // is honoured; if your handler doesn't support that, use the download helper
    // in src/lib/download.js which falls back to a raw `fetch` with the Bearer
    // token from AuthToken.
    downloadAuditBundle: ({ electionId }) =>
        api.get(`/admin/election/${electionId}/auditBundle.zip`, { responseType: "blob" }),

    // ============================ SUPERADMIN / ORG ==========================
    createOrganization: (payload) => api.post("/superadmin/org/create", { json: payload }),
    assignOrgAdmin:     ({ email, orgId }) =>
        api.post("/superadmin/org/assign/admin", { query: { email, orgId } }),
    getAllOrganizations: () => api.get("/superadmin/org/all", {}),

    // Platform-wide list of every user with role=admin. Used by SuperDashboard
    // and SuperOrgs to compute admin counts + render admin lists.
    getAllAdmins: () => api.get("/superadmin/admins", {}),
    // Admins for a single organisation — used when drilling into an org card.
    getOrgAdmins: ({ orgId }) => api.get(`/superadmin/org/${orgId}/admins`, {}),
};
