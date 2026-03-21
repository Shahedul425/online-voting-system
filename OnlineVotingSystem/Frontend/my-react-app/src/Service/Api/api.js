const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const api = async (url) => {
    const token = sessionStorage.getItem("access_token");
    const res = await fetch(`${BASE_URL}${url}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
};