const DEFAULT_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8080";
function newRequestId(){
    if(crypto!=="undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getToken(){
    try{
        return sessionStorage.getItem("access_token");
    }catch {
        return null;
    }
}

async function safeParseJson(res){
    try{
        return await res.json();
    }catch {
        return null;
    }
}

export async function apiRequest(path,options = {}) {
    const {
        method = "GET",
        baseUrl = DEFAULT_BASE_URL,
        requiresAuth = true,
        query,
        json,
        formData,
        headers = {}
    } = options;

    const rid = newRequestId();
// build query string
    const qs =
        query && typeof query === "object"
            ? "?" +
            Object.entries(query)
                .filter(([, v]) => v !== undefined && v !== null && `${v}`.trim() !== "")
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join("&")
            : "";
    const url = `${baseUrl}${path}${qs}`;
    const finalHeaders = {
        "X-Request-Id":rid,
        ...headers,
    };
    if(requiresAuth){
        const token = getToken();
        if(!token){
            return{
                ok:false,
                error:{
                    message:"Missing access token.Please login.",
                    status:401,
                    code:"UNAUTHORIZED",
                    requestId:rid,
                    path,
                    details:[],
                },
            };
        }
        finalHeaders.Authorization = `Bearer ${token}`;
    }
    let body = undefined;
    if(json!==undefined){
        finalHeaders["Content-Type"] = "application/json";
        body = JSON.stringify(json);
    }
    if(formData instanceof FormData){
        body = formData;
    }
    try {
        const res = await fetch(url,{method,headers:finalHeaders,body});
        if(res.ok){
            const text = await res.text();
            if(!text) return {ok:true,data:null};
            try{
                return {ok:true,data:JSON.parse(text)};
            }catch {
                return {ok:true,data:text};
            }
        }
        const apiErr = await safeParseJson(res);
        if(apiErr && typeof apiErr ==="object" && apiErr.message){
            return {
                ok:false,
                error:{
                    message:apiErr.message||"Request failed",
                    status:apiErr.status??res.status,
                    code:apiErr.code,
                    details:apiErr.details||[],
                    requestId:apiErr.requestId||rid,
                    path:apiErr.path||path,
                },
            };
        }
        return {
            ok:false,
            error:{
                message:`Request failed (${res.status})`,
                status:res.status,
                code:"HTTP_ERROR",
                details:[],
                requestId:rid,
                path,
            },
        };
    }catch {
        return {
            ok:false,
            error:{
                message:"Network error.Check backend server/ CORS.",
                status:0,
                code:"NETWORK_ERROR",
                details:[],
                requestId:rid,
                path,
            },
        };
    }
}

export const api = {
    get: (path, opts) => apiRequest(path, { ...opts, method: "GET" }),
    post: (path, opts) => apiRequest(path, { ...opts, method: "POST" }),
    put: (path, opts) => apiRequest(path, { ...opts, method: "PUT" }),
    del: (path, opts) => apiRequest(path, { ...opts, method: "DELETE" }),
};