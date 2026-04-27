/*
 * TrustVote — new App.jsx with the warm-trust route layout.
 * Drop this in as your Frontend/my-react-app/src/App.jsx after importing tokens.css from index.css.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./Service/Auth/ProtectedRoute.jsx";
import ErrorBoundary from "./Components/Errors/ErrorBoundary.jsx";

// Public
import Landing             from "./pages/public/Landing";
import HowItWorks          from "./pages/public/HowItWorks";
import Features            from "./pages/public/Features";
import Trust               from "./pages/public/Trust";
import SignIn              from "./pages/public/SignIn";
import SignUp              from "./pages/public/SignUp";
import ForgotPassword      from "./pages/public/ForgotPassword";
import ResetPassword       from "./pages/public/ResetPassword";
import RequestOrg          from "./pages/public/RequestOrg";
import PublicVerifyReceipt from "./pages/public/PublicVerifyReceipt";
import Demo                from "./pages/public/Demo";

// Voter
import VoterDashboard      from "./pages/voter/VoterDashboard";
import VoterElections      from "./pages/voter/VoterElections";
import VoterElectionDetail from "./pages/voter/VoterElectionDetail";
import VoterBallot         from "./pages/voter/VoterBallot";
import VoteSubmitted       from "./pages/voter/VoteSubmitted";
import VoterReceipt        from "./pages/voter/VoterReceipt";
import VoterResults        from "./pages/voter/VoterResults";

// Admin
import AdminDashboard       from "./pages/admin/AdminDashboard";
import AdminElections       from "./pages/admin/AdminElections";
import AdminCreateElection  from "./pages/admin/AdminCreateElection";
import AdminEditElection    from "./pages/admin/AdminEditElection";
import AdminElectionDetail  from "./pages/admin/AdminElectionDetail";
import AdminLiveTurnout     from "./pages/admin/AdminLiveTurnout";
import AdminResults         from "./pages/admin/AdminResults";
import AdminAudit           from "./pages/admin/AdminAudit";

// Super + stubs
import SuperHealth    from "./pages/super/SuperHealth";
import SuperOrgDetail from "./pages/super/SuperOrgDetail";
import {
  VoterNotifications,
  AdminUploadVoters, AdminUploadCandidates, AdminVoterList, AdminCandidateList,
  SuperDashboard, SuperOrgs, SuperCreateOrg, SuperAdmins,
} from "./pages/stubs";

const voter      = (el) => <ProtectedRoute roles={["voter"]}>{el}</ProtectedRoute>;
const admin      = (el) => <ProtectedRoute roles={["admin"]}>{el}</ProtectedRoute>;
const superadmin = (el) => <ProtectedRoute roles={["superadmin"]}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <ErrorBoundary>
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"             element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features"     element={<Features />} />
        <Route path="/trust"        element={<Trust />} />
        <Route path="/signin"         element={<SignIn />} />
        <Route path="/signup"         element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/request-org"     element={<RequestOrg />} />
        <Route path="/contact"         element={<RequestOrg />} />
        <Route path="/verify-receipt" element={<PublicVerifyReceipt />} />
        <Route path="/demo"            element={<Demo />} />
        <Route path="/try"             element={<Demo />} />

        {/* Voter */}
        <Route path="/voter/dashboard"         element={voter(<VoterDashboard />)} />
        <Route path="/voter/elections"         element={voter(<VoterElections />)} />
        <Route path="/voter/election/:id"      element={voter(<VoterElectionDetail />)} />
        <Route path="/voter/ballot/:id"        element={voter(<VoterBallot />)} />
        <Route path="/voter/submitted/:id"     element={voter(<VoteSubmitted />)} />
        <Route path="/voter/receipt/:id"       element={voter(<VoterReceipt />)} />
        <Route path="/voter/results/:id"       element={voter(<VoterResults />)} />
        <Route path="/voter/notifications"     element={voter(<VoterNotifications />)} />

        {/* Admin */}
        <Route path="/admin/dashboard"                         element={admin(<AdminDashboard />)} />
        <Route path="/admin/elections"                         element={admin(<AdminElections />)} />
        <Route path="/admin/elections/create"                  element={admin(<AdminCreateElection />)} />
        <Route path="/admin/elections/:id"                     element={admin(<AdminElectionDetail />)} />
        <Route path="/admin/elections/:id/edit"                element={admin(<AdminEditElection />)} />
        <Route path="/admin/elections/:id/live"                element={admin(<AdminLiveTurnout />)} />
        <Route path="/admin/elections/:id/results"             element={admin(<AdminResults />)} />
        <Route path="/admin/elections/:id/audit"               element={admin(<AdminAudit />)} />
        <Route path="/admin/elections/:id/uploads/voters"      element={admin(<AdminUploadVoters />)} />
        <Route path="/admin/elections/:id/uploads/candidates"  element={admin(<AdminUploadCandidates />)} />
        <Route path="/admin/elections/:id/voters"              element={admin(<AdminVoterList />)} />
        <Route path="/admin/elections/:id/candidates"          element={admin(<AdminCandidateList />)} />
        <Route path="/admin/audit"                             element={admin(<AdminAudit />)} />

        {/* Super */}
        <Route path="/superadmin/dashboard"  element={superadmin(<SuperDashboard />)} />
        <Route path="/superadmin/orgs"        element={superadmin(<SuperOrgs />)} />
        <Route path="/superadmin/orgs/create" element={superadmin(<SuperCreateOrg />)} />
        <Route path="/superadmin/orgs/:id"    element={superadmin(<SuperOrgDetail />)} />
        <Route path="/superadmin/admins"     element={superadmin(<SuperAdmins />)} />
        <Route path="/superadmin/health"     element={superadmin(<SuperHealth />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}
