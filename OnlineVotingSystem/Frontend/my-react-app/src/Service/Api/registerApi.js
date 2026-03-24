const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function registerRequest(email, username, firstName, lastName, password) {
    const response = await fetch(`${BASE_URL}/public/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, firstName, lastName, password }),
    });

    const data = await response.json().catch(() => null);

    if (response.status === 409) {
        throw new Error(data?.message || data?.error || "User already exists.");
    }

    if (!response.ok) {
        throw new Error(data?.message || "Registration failed.");
    }

    return data;
}