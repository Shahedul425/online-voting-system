export async function registerRequest(email, username, firstName, lastName, password) {
    const response = await fetch("http://localhost:8080/public/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, firstName, lastName, password }),
        credentials: "include"
    });

    if (response.status === 409) {
        // email exists
        const data = await response.json();
        throw new Error(data.error);
    }

    if (!response.ok) {
        throw new Error("Registration failed");
    }

    return await response.json();
}
