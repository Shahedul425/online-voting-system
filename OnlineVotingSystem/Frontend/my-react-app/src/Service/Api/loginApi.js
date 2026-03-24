const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function loginRequest(username, password) {
    const response = await fetch(`${BASE_URL}/public/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error("Login failed.");
    }

    return await response.json();
}