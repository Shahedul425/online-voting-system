// src/state/tokenStore.js
export const VoteToken = {
    get() {
        try {
            const tokenId = sessionStorage.getItem("vote_token");
            const expiryTime = sessionStorage.getItem("vote_token_expiry");
            if (!tokenId || !expiryTime) return null;

            // optional: expiry check
            const exp = new Date(expiryTime).getTime();
            if (!Number.isFinite(exp) || Date.now() > exp) return null;

            return { tokenId, expiryTime };
        } catch {
            return null;
        }
    },

    set({ tokenId, expiryTime }) {
        try {
            sessionStorage.setItem("vote_token", tokenId);
            sessionStorage.setItem("vote_token_expiry", expiryTime);
        } catch {}
    },

    clear() {
        try {
            sessionStorage.removeItem("vote_token");
            sessionStorage.removeItem("vote_token_expiry");
        } catch { /* empty */ }
    },
};
