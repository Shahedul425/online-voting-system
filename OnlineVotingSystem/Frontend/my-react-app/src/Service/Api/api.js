import keycloak from "../Auth/Keycloak.js";
export const api = async (url)=>{
    const token = keycloak.token;
    const res = await fetch(`http://localhost:8080${url}`,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    });
    return res.json();
}