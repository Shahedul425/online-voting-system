// src/api/endpoints.js
import { api } from "./GlobalApiHandler.js";
// src/api/endpoints.js

export const OVS = {
    // AUTH
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

    me: () => api.get("/user/me", { requiresAuth: true }),

    // ELECTIONS
    createElection: (payload) => api.post("/admin/election/create", { json: payload }),

    updateElection: ({ id, payload }) =>
        api.post("/election/update", { query: { id }, json: payload }),

    startElection: ({ id }) => api.post(`/admin/election/start/${id}`, {}),
    stopElection: ({ id }) => api.post(`/admin/election/stop/${id}`, {}),
    closeElection: ({ id }) => api.post(`/admin/election/close/${id}`, {}),
    publishElection: ({ id }) => api.post(`/admin/election/publish/${id}`, {}),

    getElectionById: ({ id }) => api.get(`/admin/election/ElectionById/${id}`, {}),
    getActiveElections: ({ orgId }) => api.get(`/admin/election/ActiveElections/${orgId}`, {}),
    getAllElections: ({ orgId }) => api.get(`/admin/election/all/${orgId}`, {}),
    getVoterAllActiveElections: ({ orgId }) => api.get(`/voter/election/ActiveElections/${orgId}`, {}),

    getElectionByStatus: ({ status,orgId }) => api.get(`/admin/election/ElectionByStatus`, { query: { status,orgId } }),

    getVoterListByElection: ({ electionId }) => api.get(`/admin/election/VoterListByElection/${electionId}`, {}),
    getVoterCandidates: ({ electionId }) => api.get(`/voter/election/AllCandidate/${electionId}`, {}),
    getCandidates: ({ electionId }) => api.get(`/admin/election/AllCandidate/${electionId}`, {}),
    totalVoters: ({ electionId }) => api.get(`/admin/election/TotalVoterByElection/${electionId}`, {}),
    totalCandidates: ({ electionId }) => api.get(`/admin/election/TotalCandidateByElection/${electionId}`, {}),
    castVoteBallot:(payload)=>api.post(`/voter/vote/cast`,{json:payload}),
    verifyVoter:({voterId,electionId}) => api.post(`/voter/verification/verify`,{query:{voterId,electionId}}),
    // UPLOADS
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

    // AUDIT
    auditSearch: (payload) => api.post("/audit/search", { json: payload }),
    auditGetOne: ({ electionId, auditId }) => api.get(`/audit/${electionId}/${auditId}`, {}),

    // superadmin org mgmt (ONLY endpoints you currently have)
    createOrganization: (payload) => api.post("/superadmin/org/create", { json: payload }),
    assignOrgAdmin: ({ email, orgId }) =>
        api.post("/superadmin/org/assign/admin", { query: { email, orgId } }),

};

