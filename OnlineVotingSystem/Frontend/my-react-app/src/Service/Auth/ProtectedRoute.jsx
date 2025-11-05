import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
    const accessToken = localStorage.getItem("accessToken");
    const userRoles = JSON.parse(localStorage.getItem("roles")) || [];

    // Not logged in → go to login
    if (!accessToken) {
        return <Navigate to="/signin" replace />;
    }

    // Role protection check
    if (roles && !roles.some(role => userRoles.includes(role))) {
        return <Navigate to="/" replace />;
    }

    return children;
}
