// import React, { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
// // ✅ Correct import at top of home.jsx
// import apiClient, { getAccessToken, setClientToken } from "../../spotify.js";
// import Library from "./library";
// import Favorites from "./favorites";
// import Players from "./players";
// import Trending from "./trending";
// import Feed from "./feed";
// import Sidebar from "../components/sidebar";
// import Login from "./auth/login";




// export default function Home() {
//     const [token, setToken] = useState(localStorage.getItem("token") || "");
//     const [clientReady, setClientReady] = useState(false); // ← add this
//     const params = new URLSearchParams(window.location.search);
//     const code = params.get("code");

//     useEffect(() => {
//         if (code && !token) {
//             const verifier = localStorage.getItem("code_verifier");
//             if (!verifier) return;

//             getAccessToken(code).then((accessToken) => {
//                 if (!accessToken) return;
//                 setToken(accessToken);
//                 localStorage.setItem("token", accessToken);
//                 localStorage.removeItem("code_verifier");
//                 window.history.replaceState({}, document.title, "/");
//                 setClientToken(accessToken);
//                 setClientReady(true); // ← mark ready
//             });
//         } else if (token) {
//             setClientToken(token);

//             apiClient.get("me")
//                 .then(() => setClientReady(true)) // ← only show app after token verified
//                 .catch(() => {
//                     localStorage.removeItem("token");
//                     setToken("");
//                 });
//         }
//     }, []);

//     if (!token) return <Login />;
//     if (!clientReady) return null; // ← wait for axios to be ready before mounting Sidebar/Library

//     return (
//         <Router>
//             <div className="w-screen h-screen bg-blue-200 rounded-xl flex">
//                 <Sidebar  />
//                 <Routes>
//                     <Route path="/" element={<Feed />} />
//                     <Route path="/library" element={<Library />} />
//                     <Route path="/favorites" element={<Favorites />} />
//                     <Route path="/players" element={<Players />} />
//                     <Route path="/trending" element={<Trending />} />
//                     <Route path="/feed" element={<Feed />} />
//                 </Routes>
//             </div>
//             
//         </Router>
//     );
// }


import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
// ✅ Correct import at top of home.jsx
import apiClient, { getAccessToken, setClientToken } from "../../spotify.js";
import Library from "./library";
import Favorites from "./favorites";
import Players from "./players";
import Trending from "./trending";
import Feed from "./feed";
import Sidebar from "../components/sidebar";
import Login from "./auth/login";




export default function Home() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [clientReady, setClientReady] = useState(false); // ← add this
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    useEffect(() => {
        if (code && !token) {
            const verifier = localStorage.getItem("code_verifier");
            if (!verifier) return;

            getAccessToken(code).then((accessToken) => {
                if (!accessToken) return;
                setToken(accessToken);
                localStorage.setItem("token", accessToken);
                localStorage.removeItem("code_verifier");
                window.history.replaceState({}, document.title, "/");
                setClientToken(accessToken);
                setClientReady(true); // ← mark ready
            });
        } else if (token) {
            setClientToken(token);

            apiClient.get("me")
                .then(() => setClientReady(true)) // ← only show app after token verified
                .catch(() => {
                    localStorage.removeItem("token");
                    setToken("");
                });
        }
    }, []);

    if (!token) return <Login />;
    if (!clientReady) return null; // ← wait for axios to be ready before mounting Sidebar/Library

    return (
        <Router>
            <div className="flex h-dvh w-screen flex-col overflow-hidden bg-blue-200 md:flex-row">
                <Sidebar />
                <main className="min-h-0 flex-1 overflow-hidden">
                    <Routes>
                        <Route path="/" element={<Feed />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/players" element={<Players />} />
                        <Route path="/trending" element={<Trending />} />
                        <Route path="/feed" element={<Feed />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}
