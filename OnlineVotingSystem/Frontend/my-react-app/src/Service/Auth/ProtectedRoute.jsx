// src/Service/Auth/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppStore } from "../GlobalState/appStore"; // adjust if needed
import { OVS } from "../Api/endpoints.js";             // adjust if needed
import { withUnwrap } from "../Api/apiUnwrap";         // adjust if needed
import { AuthToken } from "../GlobalState/authToken";     // adjust if needed

export default function ProtectedRoute({ children, roles = [] }) {
    const location = useLocation();

    const me = useAppStore((s) => s.me);
    const setMe = useAppStore((s) => s.setMe);
    const clearMe = useAppStore((s) => s.clearMe);
    console.log("TOKEN:", sessionStorage.getItem("access_token"));
    console.log("ME:", me);

    const [booting, setBooting] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function boot() {
            const token = AuthToken.get();

            // No token => not logged in
            if (!token) {
                if (!cancelled) setBooting(false);
                return;
            }

            // Already have user => done
            if (me) {
                if (!cancelled) setBooting(false);
                return;
            }

            // Token exists but me missing => fetch /me (refresh-safe)
            try {
                const freshMe = await withUnwrap(OVS.me());
                if (!cancelled) setMe(freshMe);
            } catch {
                AuthToken.clear();
                clearMe();
            } finally {
                if (!cancelled) setBooting(false);
            }
        }

        boot();
        return () => {
            cancelled = true;
        };
    }, [me, setMe, clearMe]);

    if (booting) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-300">
                Checking session…
            </div>
        );
    }

    if (!AuthToken.get() || !me) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    const myRole = String(me.role || "").toLowerCase();
    const allowed =
        roles.length === 0 || roles.map((r) => r.toLowerCase()).includes(myRole);

    if (!allowed) {
        let fallback;
        if(myRole==="admin"){
            fallback = "/admin"
        }else if(myRole==="superadmin"){
            fallback = "/superadmin"
        }else {
            fallback = "/select"
        }
        return <Navigate to={fallback} replace />;
    }

    return children;
}
