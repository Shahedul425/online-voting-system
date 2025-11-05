
export async function  loginRequest (username,password){
    const response = await fetch("http://localhost:8080/public/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,password}),
        credentials:"include"
    })
    if (!response.ok) throw new Error("Login failed!!")
    return await response.json();
}