// src/state/authToken.js
const KEY = "access_token";

export const AuthToken = {
    key: KEY,
    get() {
        try {
            return sessionStorage.getItem(KEY);
        } catch {
            return null;
        }
    },
    set(token) {
        try {
            sessionStorage.setItem(KEY, token);
        } catch {}
    },
    clear() {
        try {
            sessionStorage.removeItem(KEY);
        } catch {}
    },
};
