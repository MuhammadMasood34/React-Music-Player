import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import apiClient, { getAccessToken, setClientToken } from "../../spotify.js";
import Library from "./library";
import Favorites from "./favorites";
import Players from "./players";
import Trending from "./trending";
import Sidebar from "../components/sidebar";
import Login from "./auth/login";
import WebPlayback from "../components/WebPlayback";
import DemoPlayback from "../components/DemoPlayback";
import useRoomSync from "../hooks/useRoomSync";
import { DEMO_TRACKS, DEMO_PLAYLIST_URIS } from "../data/demoPlaylist";




export default function Home() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [clientReady, setClientReady] = useState(false);
    const [currentDeviceId, setCurrentDeviceId] = useState(null);
    const [, setIsPlaying] = useState(false);
    const [playlistUris, setPlaylistUris] = useState([]);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [localTrackCommand, setLocalTrackCommand] = useState(null);
    const roomSync = useRoomSync();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    // Check if user is in demo mode
    const isDemoMode = localStorage.getItem("demoMode") === "true";

    useEffect(() => {
        // If in demo mode, skip Spotify auth entirely
        if (isDemoMode) {
            setClientReady(true);
            return;
        }

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
                setClientReady(true);
            });
        } else if (token) {
            setClientToken(token);

            apiClient.get("me")
                .then(() => setClientReady(true))
                .catch(() => {
                    localStorage.removeItem("token");
                    setToken("");
                });
        }
    }, []);

    // Sign out handler — clears token and reloads to show login screen
    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("demoMode");
        setToken("");
        setClientReady(false);
        window.location.reload();
    };

    // Exit demo mode handler (same as sign out for demo users)
    const handleExitDemoMode = () => {
        localStorage.removeItem("demoMode");
        window.location.reload();
    };

    // Show login screen if not in demo mode and no token
    if (!isDemoMode && !token) return <Login />;
    if (!clientReady) return null;

    const handleWebPlaybackReady = (deviceId) => {
        console.log("WebPlayback READY callback received! Device ID:", deviceId);
        setCurrentDeviceId(deviceId);
    };

    const handleWebPlaybackNotReady = (deviceId) => {
        console.warn("WebPlayback device went offline:", deviceId);
        setCurrentDeviceId((activeDeviceId) => (
            activeDeviceId === deviceId ? null : activeDeviceId
        ));
    };

    const handlePlayerStateChange = (state) => {
        if (state) {
            setIsPlaying(!state.paused);
        }
    };

    const sharedPlaylistUris = roomSync.sharedPlaylist.map((track) => track.uri).filter(Boolean);

    return (
        <Router>
            <div className="flex h-dvh w-screen flex-col overflow-hidden bg-blue-200 md:flex-row">
                <Sidebar isDemoMode={isDemoMode} onSignOut={handleSignOut} />


                <main className="min-h-0 flex-1 overflow-hidden">
                    <Routes>
                        <Route path="/" element={(
                            <Players
                                token={token}
                                currentDeviceId={currentDeviceId}
                                setCurrentDeviceId={setCurrentDeviceId}
                                setIsPlaying={setIsPlaying}
                                setPlaylistUris={setPlaylistUris}
                                playlistTracks={playlistTracks}
                                setPlaylistTracks={setPlaylistTracks}
                                setLocalTrackCommand={setLocalTrackCommand}
                                roomSync={roomSync}
                                isDemoMode={isDemoMode}
                            />
                        )} />
                        <Route path="/players" element={(
                            <Players
                                token={token}
                                currentDeviceId={currentDeviceId}
                                setCurrentDeviceId={setCurrentDeviceId}
                                setIsPlaying={setIsPlaying}
                                setPlaylistUris={setPlaylistUris}
                                playlistTracks={playlistTracks}
                                setPlaylistTracks={setPlaylistTracks}
                                setLocalTrackCommand={setLocalTrackCommand}
                                roomSync={roomSync}
                                isDemoMode={isDemoMode}
                            />
                        )} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/favorites" element={<Favorites token={token} isDemoMode={isDemoMode} />} />
                        <Route path="/trending" element={<Trending token={token} isDemoMode={isDemoMode} />} />
                    </Routes>
                </main>

                {/* Render DemoPlayback for demo mode, WebPlayback for premium users */}
                {isDemoMode ? (
                    <DemoPlayback
                        playlistTracks={roomSync.sharedPlaylist.length > 0 ? roomSync.sharedPlaylist : DEMO_TRACKS}
                        playlistUris={sharedPlaylistUris.length > 0 ? sharedPlaylistUris : DEMO_PLAYLIST_URIS}
                        incomingCommand={roomSync.incomingCommand}
                        incomingProgress={roomSync.incomingProgress}
                        localTrackCommand={localTrackCommand}
                        onRoomCommand={roomSync.sendCommand}
                        onSendProgress={roomSync.sendProgress}
                    />
                ) : (
                    <WebPlayback
                        token={token}
                        onReady={handleWebPlaybackReady}
                        onNotReady={handleWebPlaybackNotReady}
                        onPlayerStateChange={handlePlayerStateChange}
                        playlistUris={playlistUris.length > 0 ? playlistUris : sharedPlaylistUris}
                        playlistTracks={roomSync.sharedPlaylist.length > 0 ? roomSync.sharedPlaylist : playlistTracks}
                        incomingCommand={roomSync.incomingCommand}
                        incomingProgress={roomSync.incomingProgress}
                        localTrackCommand={localTrackCommand}
                        onRoomCommand={roomSync.sendCommand}
                        onSendProgress={roomSync.sendProgress}
                    />
                )}
            </div>
        </Router>
    );
}
