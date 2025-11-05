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
            </Routes>
        </Router>
    );
}

export default App;
