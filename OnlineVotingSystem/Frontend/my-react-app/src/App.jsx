import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./Service/Auth/ProtectedRoute.jsx";
import SignIn from "./Components/SignIn/SignIn.jsx";
import SignUp from "./Components/SignUp/SignUp.jsx";
import Verification from "./Components/Verification/Verification.jsx";
import Vote from "./Components/VotingInterface/Vote.jsx";
import FinalVote from "./Components/Finalize Vote/FinalVote.jsx";
import ThankYou from "./Components/ThankYou/Thankyou.jsx";
import AdminPanel from "./Components/Admin/AdminPanel/AdminPanel.jsx";
import ElectionSelect from "./Components/ElectionSelectVoter/ElectionSelect.jsx";
import Introduction from "./Components/Introduction/Introduction.jsx";
import AdminCreateElection from "./Components/Admin/Election/AdminCreateElection.jsx";
import AdminUploadVoters from "./Components/Admin/Election/AdminUploadVoter.jsx";
import AdminUploadCandidates from "./Components/Admin/Election/AdminUploadCandidates.jsx";
import AdminAuditLogs from "./Components/Admin/Election/AdminAuditLogs.jsx";
import AdminVoterList from "./Components/Admin/Election/AdminVoterList.jsx";
import AdminCandidateList from "./Components/Admin/Election/AdminCandidateList.jsx";
import SuperAdminPanel from "./Components/SuperAdmin/SuperAdminPanel.jsx";
import OrgCreate from "./Components/SuperAdmin/Organization/OrgCreate.jsx";
import AssignOrgAdmin from "./Components/SuperAdmin/Organization/AssignOrgAdmin.jsx";
import OrganizationsHome from "./Components/SuperAdmin/Organization/OrgHome.jsx";
import AdminElectionsByStatus from "./Components/Admin/Election/AdminElectionsByStatus.jsx";
import AdminElectionWorkspace from "./Components/Admin/Election/AdminElectionWorkSpace.jsx";
import AdminUpdateElection from "./Components/Admin/Election/AdminUpdateElection.jsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Introduction />} />

                {/* Public */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Voter Pages */}
                <Route path="/select" element={
                    <ProtectedRoute roles={["voter"]}>
                        <ElectionSelect />
                    </ProtectedRoute>
                } />

                <Route path="/verification" element={
                    <ProtectedRoute roles={["voter"]}>
                        <Verification />
                    </ProtectedRoute>
                } />

                <Route path="/vote" element={
                    <ProtectedRoute roles={["voter"]}>
                        <Vote />
                    </ProtectedRoute>
                } />

                <Route path="/final-vote" element={
                    <ProtectedRoute roles={["voter"]}>
                        <FinalVote />
                    </ProtectedRoute>
                } />

                <Route path="/thank-you" element={
                    <ProtectedRoute roles={["voter"]}>
                        <ThankYou />
                    </ProtectedRoute>
                } />

                {/* Admin Page */}
                <Route path="/admin" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminPanel />
                    </ProtectedRoute>
                } />
                <Route
                    path="/admin/elections/status"
                    element={
                        <ProtectedRoute roles={["admin"]}>
                            <AdminElectionsByStatus />
                        </ProtectedRoute>
                    }
                />
                <Route path="/admin/elections/:electionId" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminElectionWorkspace />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/create" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminCreateElection />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/:electionId/uploads/voters" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminUploadVoters />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/:electionId/uploads/candidates" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminUploadCandidates />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/:electionId/update" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminUpdateElection />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/:electionId/audit" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminAuditLogs />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/:electionId/voters" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminVoterList />
                    </ProtectedRoute>
                } />
                <Route path="/admin/elections/:electionId/candidates" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminCandidateList />
                    </ProtectedRoute>
                } />
                <Route path="/superAdmin" element={
                    <ProtectedRoute roles={["superadmin"]}>
                        <SuperAdminPanel />
                    </ProtectedRoute>
                } />
                <Route path="/superadmin/orgs/create" element={
                    <ProtectedRoute roles={["superadmin"]}>
                        <OrgCreate />
                    </ProtectedRoute>
                } />
                <Route path="/superadmin/orgs/assign-admin" element={
                    <ProtectedRoute roles={["superadmin"]}>
                        <AssignOrgAdmin />
                    </ProtectedRoute>
                } />
                <Route path="/superAdmin/orgs" element={
                    <ProtectedRoute roles={["voter"]}>
                        <OrganizationsHome />
                    </ProtectedRoute>
                } />


            </Routes>

        </Router>
    );
}

export default App;
