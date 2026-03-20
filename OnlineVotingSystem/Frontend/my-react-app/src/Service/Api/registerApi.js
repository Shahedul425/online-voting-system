const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function registerRequest(email, username, firstName, lastName, password) {
    const response = await fetch(`${BASE_URL}/public/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, firstName, lastName, password }),
        credentials: "include"
    });

    if (response.status === 409) {
        const data = await response.json();
        throw new Error(data.error);
    }

    if (!response.ok) {
        throw new Error("Registration failed");
    }

    return await response.json();
}