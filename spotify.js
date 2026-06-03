// import axios from "axios";

// const clientID = "c6061922bd924f2ebde2ecce0cac4de9";
// const redirectURI = "http://127.0.0.1:5173/";
// const scopes = ["user-library-read", "playlist-read-private"];

// // Generate random string for code verifier
// function generateRandomString(length) {
//     const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     const values = crypto.getRandomValues(new Uint8Array(length));
//     return values.reduce((acc, x) => acc + possible[x % possible.length], "");
// }

// // Hash the verifier
// async function generateCodeChallenge(codeVerifier) {
//     const encoder = new TextEncoder();
//     const data = encoder.encode(codeVerifier);
//     const digest = await crypto.subtle.digest("SHA-256", data);
//     return btoa(String.fromCharCode(...new Uint8Array(digest)))
//         .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
// }

// // Start login
// export async function loginWithSpotify() {
//     const codeVerifier = generateRandomString(64);
//     const codeChallenge = await generateCodeChallenge(codeVerifier);

//     localStorage.setItem("code_verifier", codeVerifier);

//     const params = new URLSearchParams({
//         client_id: clientID,
//         response_type: "code",
//         redirect_uri: redirectURI,
//         scope: scopes.join(" "),
//         code_challenge_method: "S256",
//         code_challenge: codeChallenge,
//     });

//     window.location.href = `https://accounts.spotify.com/authorize?${params}`;
// }

// // Exchange code for token
// export async function getAccessToken(code) {
//     const codeVerifier = localStorage.getItem("code_verifier");

//     const response = await fetch("https://accounts.spotify.com/api/token", {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: new URLSearchParams({
//             client_id: clientID,
//             grant_type: "authorization_code",
//             code,
//             redirect_uri: redirectURI,
//             code_verifier: codeVerifier,
//         }),
//     });
    
//     const data = await response.json();
//     console.log("Token response:", data); // ← debug log
//     return data.access_token;
// }

// const apiClient = axios.create({
//     baseURL: "https://api.spotify.com/v1/",
// });

// let requestInterceptor = null;

// export const setClientToken = (token) => {
//     if (requestInterceptor !== null) {
//         apiClient.interceptors.request.eject(requestInterceptor);
//     }
//     requestInterceptor = apiClient.interceptors.request.use((config) => {
//         config.headers.Authorization = "Bearer " + token;
//         return config;
//     });
// };

// export default apiClient;



import axios from "axios";

const clientID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "c6061922bd924f2ebde2ecce0cac4de9";
const redirectURI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/`;
const scopes = ["user-library-read", "playlist-read-private","streaming","user-read-email","user-read-private","user-modify-playback-state","user-read-playback-state"];

// Generate random string for code verifier
function generateRandomString(length) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Hash the verifier
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Start login
export async function loginWithSpotify() {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    localStorage.setItem("code_verifier", codeVerifier);

    const params = new URLSearchParams({
        client_id: clientID,
        response_type: "code",
        redirect_uri: redirectURI,
        scope: scopes.join(" "),
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Exchange code for token
export async function getAccessToken(code) {
    const codeVerifier = localStorage.getItem("code_verifier");

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientID,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectURI,
            code_verifier: codeVerifier,
        }),
    });
    
    const data = await response.json();
    console.log("Token response:", data); // ← debug log
    return data.access_token;
}

const apiClient = axios.create({
    baseURL: "https://api.spotify.com/v1/",
});

let requestInterceptor = null;

export const setClientToken = (token) => {
    if (requestInterceptor !== null) {
        apiClient.interceptors.request.eject(requestInterceptor);
    }
    requestInterceptor = apiClient.interceptors.request.use((config) => {
        config.headers.Authorization = "Bearer " + token;
        return config;
    });
};


//4/16/2026
const savedToken = localStorage.getItem("token");
if (savedToken) {
    setClientToken(savedToken);
}

export default apiClient;
