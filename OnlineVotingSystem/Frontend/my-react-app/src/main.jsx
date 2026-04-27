import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
import React from "react";
import './index.css'
import App from './App.jsx'
import ReactDOM from "react-dom/client";
import keycloak from "./Service/Auth/Keycloak.js";
import { initTheme } from "./ui/ThemeToggle";

// Set theme class on <html> before React mounts so there's no flash.
initTheme();

keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html"
})
    .then(() => {
        ReactDOM.createRoot(document.getElementById("root")).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    });