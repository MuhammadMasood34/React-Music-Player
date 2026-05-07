import React, { useState, useEffect, useRef } from "react";

export default function WebPlayback({ token, onReady, onPlayerStateChange, playlistUris }) {

    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [currentPlaylist, setCurrentPlaylist] = useState([]);

    // Progress bar states
    const [currentPosition, setCurrentPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const progressIntervalRef = useRef(null);
    const lastPositionRef = useRef(0);
    const isSeekingRef = useRef(false);

    const playerRef = useRef(null);
    const lastProcessedStateRef = useRef(null);
    const stateTimeoutRef = useRef(null);

    const hasInitialState = useRef(false);
    const lastState = useRef(null);

    // FIX: safeSeek as a ref so it's accessible outside onSpotifyWebPlaybackSDKReady
    const safeSeekRef = useRef(async (ms) => {
        if (!hasInitialState.current || !lastState.current) return;
        if (!playerRef.current) return;
        await playerRef.current.seek(ms);
    });

    // NEW: handleSeek — seeks by percentage (0.0 to 1.0)
    // Uses lastState.current for duration so no stale closure issues
    const handleSeek = async (percent) => {
        if (!lastState.current || !lastState.current.track_window?.current_track) return;
        const trackDuration = lastState.current.duration;
        const positionMs = Math.floor(trackDuration * percent);
        await safeSeekRef.current(positionMs);
    };


    useEffect(() => {
        if (!token) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Spotify SDK ready, creating player...");

            const spotifyPlayer = new window.Spotify.Player({
                name: "My Music Player",
                getOAuthToken: (cb) => cb(token),
                volume: 0.5,
            });

            // NEW: start playback as soon as player is ready
            spotifyPlayer.addListener("ready", async ({ device_id }) => {
                console.log("Player ready with Device ID:", device_id);
                setDeviceId(device_id);
                setIsPlayerReady(true);

                // Transfer playback to this device
                await fetch(`https://api.spotify.com/v1/me/player`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "device_ids": [device_id],
                        "play": false
                    })
                });
                console.log("Playback transferred to this device");

                // NEW: start playback immediately after device is ready
                if (playlistUris && playlistUris.length > 0) {
                    await startPlayback(device_id);
                }

                if (onReady) onReady(device_id);
            });

            // FIX: use spotifyPlayer (not player which is null here)
            // NEW: also mirrors the pattern from the snippet — setState(state) equivalent
            spotifyPlayer.addListener("player_state_changed", (state) => {
                if (!state) return;

                // NEW: update refs (mirrors snippet's setState(state))
                hasInitialState.current = true;
                lastState.current = state;

                if (stateTimeoutRef.current) {
                    clearTimeout(stateTimeoutRef.current);
                }

                stateTimeoutRef.current = setTimeout(() => {
                    const trackId = state.track_window.current_track?.id;
                    const isPausedState = state.paused;
                    const position = state.position;
                    const trackDuration = state.duration;

                    const stateKey = `${trackId}-${isPausedState}-${Math.floor(position / 1000)}`;

                    if (lastProcessedStateRef.current !== stateKey) {
                        lastProcessedStateRef.current = stateKey;

                        console.log("Now playing:", state.track_window.current_track?.name);
                        setCurrentTrack(state.track_window.current_track);
                        setIsPaused(state.paused);

                        if (trackDuration !== duration) {
                            setDuration(trackDuration);
                        }

                        if (!isSeekingRef.current) {
                            setCurrentPosition(position);
                            lastPositionRef.current = position;
                        }

                        if (currentPlaylist.length > 0 && state.track_window.current_track?.uri) {
                            const index = currentPlaylist.findIndex(uri => uri === state.track_window.current_track.uri);
                            if (index !== -1 && index !== currentTrackIndex) {
                                setCurrentTrackIndex(index);
                            }
                        }

                        if (onPlayerStateChange) onPlayerStateChange(state);
                    }
                }, 50);
            });

            spotifyPlayer.addListener("initialization_error", ({ message }) => {
                console.error("Initialization Error:", message);
            });

            spotifyPlayer.addListener("authentication_error", ({ message }) => {
                console.error("Authentication Error:", message);
            });

            spotifyPlayer.addListener("account_error", ({ message }) => {
                console.error("Account Error:", message);
                alert("Spotify Premium is required for playback");
            });

            spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                console.log("Device has gone offline:", device_id);
                setIsPlayerReady(false);
                stopProgressUpdates();
                playerRef.current = null;
            });

            spotifyPlayer.addListener("playback_error", ({ message }) => {
                console.error("Playback Error:", message);
            });

            spotifyPlayer.connect().then(success => {
                if (success) {
                    console.log("🎉 WebPlayback CONNECTED successfully!");

                    spotifyPlayer.getCurrentState().then(state => {
                        if (!state) {
                            console.error('User is not playing music through the Web Playback SDK');
                            return;
                        }

                        var current_track = state.track_window.current_track;
                        var next_track = state.track_window.next_tracks[0];

                        console.log('Currently Playing', current_track);
                        console.log('Playing Next', next_track);
                    });
                } else {
                    console.error("❌ WebPlayback connection FAILED");
                }
            });

            setPlayer(spotifyPlayer);
            playerRef.current = spotifyPlayer;
        };

        return () => {
            if (stateTimeoutRef.current) {
                clearTimeout(stateTimeoutRef.current);
            }
            stopProgressUpdates();
            if (playerRef.current) {
                playerRef.current.disconnect();
                playerRef.current = null;
            } else if (player) {
                player.disconnect();
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [token]);


    useEffect(() => {
        if (!isPaused && isPlayerReady && player && duration > 0) {
            startSmoothProgressUpdates();
        } else {
            stopProgressUpdates();
        }

        return () => {
            stopProgressUpdates();
        };
    }, [isPaused, isPlayerReady, player, duration]);


    // NEW: startPlayback — wraps /me/player/play, called on ready
    const startPlayback = async (device_id) => {
        if (!playlistUris || playlistUris.length === 0) return;

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/me/player/play?device_id=${device_id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        uris: playlistUris,
                        offset: { position: 0 },
                    }),
                }
            );
            if (response.ok) {
                console.log("Playback started via startPlayback()");
            } else {
                const err = await response.json();
                console.error("startPlayback failed:", err);
            }
        } catch (error) {
            console.error("Error in startPlayback:", error);
        }
    };


    const startSmoothProgressUpdates = () => {
        if (progressIntervalRef.current) return;

        progressIntervalRef.current = setInterval(async () => {
            const activePlayer = playerRef.current;
            if (!activePlayer || isPaused || isSeekingRef.current) return;

            try {
                const state = await activePlayer?.getCurrentState();
                if (state && !state.paused && !isSeekingRef.current) {
                    const newPosition = state.position;
                    setCurrentPosition(prev => {
                        if (Math.abs(newPosition - prev) > 50) return newPosition;
                        return prev;
                    });

                    if (state.track_window) {
                        var current_track = state.track_window.current_track;
                        var next_track = state.track_window.next_tracks[0];

                        if (Math.floor(Date.now() / 1000) % 30 === 0) {
                            console.log('Currently Playing (progress update):', current_track?.name);
                            if (next_track) {
                                console.log('Playing Next (progress update):', next_track?.name);
                            }
                        }
                    }
                }
            } catch (err) {
                stopProgressUpdates();
            }
        }, 500);
    };


    const stopProgressUpdates = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };


    // UPDATED: handleProgressBarClick now uses handleSeek(percent) internally
    const handleProgressBarClick = async (e) => {
        if (!player || !isPlayerReady) return;

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));

        console.log(`Seeking to ${(percent * 100).toFixed(1)}%`);

        isSeekingRef.current = true;

        try {
            // NEW: delegate to handleSeek(percent) instead of safeSeekRef directly
            await handleSeek(percent);

            const seekPosition = Math.floor((lastState.current?.duration ?? 0) * percent);
            setCurrentPosition(seekPosition);
            lastPositionRef.current = seekPosition;

            const state = await player.getCurrentState();
            if (state && state.track_window) {
                var current_track = state.track_window.current_track;
                var next_track = state.track_window.next_tracks[0];
                console.log('After seek - Currently Playing:', current_track?.name);
                console.log('After seek - Playing Next:', next_track?.name);
            }

            setTimeout(() => {
                isSeekingRef.current = false;
            }, 200);
        } catch (error) {
            console.error("Error seeking:", error);
            isSeekingRef.current = false;
        }
    };

    useEffect(() => {
        if (playlistUris && playlistUris.length > 0) {
            setCurrentPlaylist(playlistUris);
            console.log("Playlist loaded with", playlistUris.length, "tracks");
        }
    }, [playlistUris]);


    const handlePlay = async (trackUri, contextUris = null, deviceIdParam = null) => {
        const activeDeviceId = deviceIdParam || deviceId;

        if (!activeDeviceId) {
            console.error("No device ID available");
            return;
        }
        

        const uris = (contextUris && contextUris.length > 0) ? contextUris : [trackUri];
        try {
            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uris: uris,
                    offset: { uri: trackUri },
                })
            });

            if (response.ok) {
                console.log("Single track playback started");
                setCurrentPosition(0);
                lastPositionRef.current = 0;

                if (playerRef.current) {
                    setTimeout(async () => {
                        const state = await playerRef.current?.getCurrentState();
                        if (state && state.track_window) {
                            var current_track = state.track_window.current_track;
                            var next_track = state.track_window.next_tracks[0];
                            console.log('After playback start - Currently Playing:', current_track?.name);
                            console.log('After playback start - Playing Next:', next_track?.name);
                        }
                    }, 1000);
                }

            } else {
                const error = await response.json();
                console.error("Failed to start playback:", error);
            }
        } catch (error) {
            console.error("Error in handlePlay:", error);
        }
    };


    const togglePlay = () => {
        if (!player || !isPlayerReady) {
            console.warn("Player not ready yet");
            return;
        }

        player.togglePlay()
            .then(() => {
                console.log("Toggle play successful");
            })
            .catch(error => {
                console.error("Error toggling play:", error);
            });
    };

    const nextTrack = () => {
        if (!player || !isPlayerReady) {
            console.warn("Player not ready yet");
            return;
        }

        player.nextTrack()
            .then(async () => {
                console.log("Next track requested");
                setCurrentPosition(0);
                lastPositionRef.current = 0;

                const state = await player.getCurrentState();
                if (state && state.track_window) {
                    var current_track = state.track_window.current_track;
                    var next_track = state.track_window.next_tracks[0];
                    console.log('After next track - Currently Playing:', current_track?.name);
                    console.log('After next track - Playing Next:', next_track?.name);
                }
            })
            .catch(error => {
                console.error("Error switching to next track:", error);
            });
    };

    const prevTrack = () => {
        if (!player || !isPlayerReady) {
            console.warn("Player not ready yet");
            return;
        }

        player.previousTrack()
            .then(async () => {
                console.log("Previous track requested");
                setCurrentPosition(0);
                lastPositionRef.current = 0;

                const state = await player.getCurrentState();
                if (state && state.track_window) {
                    var current_track = state.track_window.current_track;
                    var next_track = state.track_window.next_tracks[0];
                    console.log('After previous track - Currently Playing:', current_track?.name);
                    console.log('After previous track - Playing Next:', next_track?.name);
                }
            })
            .catch(error => {
                console.error("Error switching to previous track:", error);
            });
    };

    const formatDuration = (ms) => {
        if (!ms || isNaN(ms)) return "0:00";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;

    React.useEffect(() => {
        if (onReady && deviceId) {
            if (window.__webPlaybackHandlePlay) {
                window.__webPlaybackHandlePlay = handlePlay;
            }
        }
    }, [deviceId, token]);


    return (
        <div className="fixed bottom-0 w-full bg-[#1E2A3E] p-4 flex items-center justify-evenly z-50 shadow-lg">
            {/* Track Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {currentTrack?.album?.images?.[0]?.url && (
                    <img
                        src={currentTrack.album.images[0].url}
                        className="w-[56px] h-[56px] rounded-lg object-cover shadow-md"
                        alt="Album art"
                    />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-white font-bold truncate">{currentTrack?.name ?? "No track playing"}</p>
                    <p className="text-gray-400 text-sm truncate">
                        {currentTrack?.artists?.map(a => a.name).join(", ") ?? "Select a song to play"}
                    </p>
                </div>
            </div>

            {/* Progress Bar Section */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[400px]">
                <div
                    className="w-full relative cursor-pointer group"
                    onClick={handleProgressBarClick}
                >
                    <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-200 rounded-full transition-all duration-75 relative"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-amber-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ right: '-4px' }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between w-full text-xs text-gray-400">
                    <span>{formatDuration(currentPosition)}</span>
                    <span>{formatDuration(duration)}</span>
                </div>

                <div className="flex items-center gap-6 mt-1">
                    <button
                        onClick={prevTrack}
                        className="text-white text-2xl hover:text-amber-200 transition-colors"
                        disabled={!isPlayerReady}
                    >
                        ⏮
                    </button>
                    <button
                        onClick={togglePlay}
                        className="bg-amber-200 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center text-xl hover:scale-105 transition-transform"
                        disabled={!isPlayerReady}
                    >
                        {isPaused ? "▶" : "⏸"}
                    </button>
                    <button
                        onClick={nextTrack}
                        className="text-white text-2xl hover:text-amber-200 transition-colors"
                        disabled={!isPlayerReady}
                    >
                        ⏭
                    </button>
                </div>
            </div>

            {/* Track counter */}
            <div className="w-20 text-right">
                {currentPlaylist.length > 0 && (
                    <div className="text-gray-500 text-xs">
                        {currentTrackIndex + 1}/{currentPlaylist.length}
                    </div>
                )}
            </div>
        </div>
    );
}

// import React, { useState, useEffect, useRef } from "react";

// export default function WebPlayback({ token, onReady, onPlayerStateChange, playlistUris }) {

    

//     const [player, setPlayer] = useState(null);
//     const [deviceId, setDeviceId] = useState(null);
//     const [isPaused, setIsPaused] = useState(true);
//     const [currentTrack, setCurrentTrack] = useState(null);
//     const [isPlayerReady, setIsPlayerReady] = useState(false);
//     const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
//     const [currentPlaylist, setCurrentPlaylist] = useState([]);

//     // Progress bar states
//     const [currentPosition, setCurrentPosition] = useState(0);
//     const [duration, setDuration] = useState(0);
//     const progressIntervalRef = useRef(null);
//     const lastPositionRef = useRef(0);
//     const isSeekingRef = useRef(false);

//     // FIX: playerRef always holds the latest player — intervals/closures read this
//     // instead of the stale state snapshot that caused getCurrentState() to crash
//     const playerRef = useRef(null);

//     // Track last processed state to prevent duplicates
//     const lastProcessedStateRef = useRef(null);
//     const stateTimeoutRef = useRef(null);




//     useEffect(() => {
//         if (!token) return;
//         // if (!window?.onSpotifyWebPlaybackSDKReady) return;

//         // Load Spotify SDK script
//         const script = document.createElement("script");
//         script.src = "https://sdk.scdn.co/spotify-player.js";
//         script.async = true;
//         document.body.appendChild(script);

//         window.onSpotifyWebPlaybackSDKReady = () => {
//             console.log("Spotify SDK ready, creating player...");

//             const spotifyPlayer = new window.Spotify.Player({
//                 name: "My Music Player",
//                 getOAuthToken: (cb) => cb(token),
//                 volume: 0.5,
//             });

//             spotifyPlayer.addListener("ready", ({ device_id }) => {
//                 console.log("Player ready with Device ID:", device_id);
//                 setDeviceId(device_id);
//                 setIsPlayerReady(true);

//                 fetch(`https://api.spotify.com/v1/me/player`, {
//                     method: 'PUT',
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({
//                         "device_ids": [device_id],
//                         "play": false
//                     })
//                 }).then(() => {
//                     console.log("Playback transferred to this device");
//                 });

//                 if (onReady) onReady(device_id);
//             });

//             // Handle player state changes
//             spotifyPlayer.addListener("player_state_changed", (state) => {
//                 if (!state) return;

//                 // Clear previous timeout
//                 if (stateTimeoutRef.current) {
//                     clearTimeout(stateTimeoutRef.current);
//                 }

//                 // Debounce state changes
//                 stateTimeoutRef.current = setTimeout(() => {
//                     const trackId = state.track_window.current_track?.id;
//                     const isPausedState = state.paused;
//                     const position = state.position;
//                     const trackDuration = state.duration;

//                     // Create unique key for this state
//                     const stateKey = `${trackId}-${isPausedState}-${Math.floor(position / 1000)}`;

//                     // Only process if state has changed
//                     if (lastProcessedStateRef.current !== stateKey) {
//                         lastProcessedStateRef.current = stateKey;

//                         console.log("Now playing:", state.track_window.current_track?.name);
//                         setCurrentTrack(state.track_window.current_track);
//                         setIsPaused(state.paused);

//                         // Update duration when track changes
//                         if (trackDuration !== duration) {
//                             setDuration(trackDuration);
//                         }

//                         // Update current position (not while seeking)
//                         if (!isSeekingRef.current) {
//                             setCurrentPosition(position);
//                             lastPositionRef.current = position;
//                         }

//                         if (currentPlaylist.length > 0 && state.track_window.current_track?.uri) {
//                             const index = currentPlaylist.findIndex(uri => uri === state.track_window.current_track.uri);
//                             if (index !== -1 && index !== currentTrackIndex) {
//                                 setCurrentTrackIndex(index);
//                             }
//                         }

//                         if (onPlayerStateChange) onPlayerStateChange(state);
//                     }
//                 }, 50);
//             });

//             spotifyPlayer.addListener("initialization_error", ({ message }) => {
//                 console.error("Initialization Error:", message);
//             });

//             spotifyPlayer.addListener("authentication_error", ({ message }) => {
//                 console.error("Authentication Error:", message);
//             });

//             spotifyPlayer.addListener("account_error", ({ message }) => {
//                 console.error("Account Error:", message);
//                 alert("Spotify Premium is required for playback");
//             });

//             spotifyPlayer.addListener("not_ready", ({ device_id }) => {
//                 console.log("Device has gone offline:", device_id);
//                 setIsPlayerReady(false);
//                 stopProgressUpdates();
//                 // FIX: clear ref so interval cannot call getCurrentState on dead player
//                 playerRef.current = null;
//             });

//             spotifyPlayer.addListener("playback_error", ({ message }) => {
//                 console.error("Playback Error:", message);
//             });

//             spotifyPlayer.connect().then(success => {
//                 if (success) {
//                     console.log("🎉 WebPlayback CONNECTED successfully!");
//                 } else {
//                     console.error("❌ WebPlayback connection FAILED");
//                 }
//             });

//             // FIX: set BOTH state (for React renders) AND ref (for closures/intervals)
//             setPlayer(spotifyPlayer);
//             playerRef.current = spotifyPlayer;
//         };


//         return () => {
//             if (stateTimeoutRef.current) {
//                 clearTimeout(stateTimeoutRef.current);
//             }
//             stopProgressUpdates();
//             // FIX: use ref for cleanup — state may already be stale by the time
//             // the cleanup function runs (common with async SDK initialization)
//             if (playerRef.current) {
//                 playerRef.current.disconnect();
//                 playerRef.current = null;
//             } else if (player) {
//                 player.disconnect();
//             }
//             if (script.parentNode) {
//                 script.parentNode.removeChild(script);
//             }
//         };
//     }, [token]);

//     // SMOOTH PROGRESS UPDATES - Runs every frame (60fps)

//     useEffect(() => {
//         if (!isPaused && isPlayerReady && player && duration > 0) {
//             startSmoothProgressUpdates();
//         } else {
//             stopProgressUpdates();
//         }

//         return () => {
//             stopProgressUpdates();
//         };
//     }, [isPaused, isPlayerReady, player, duration]);



//     const startSmoothProgressUpdates = () => {
//         if (progressIntervalRef.current) return;

//         progressIntervalRef.current = setInterval(async () => {
//             // FIX: read from playerRef.current — this is always the live object.
//             // Reading `player` (state) here would capture a stale closure snapshot
//             // from when this interval was created, causing getCurrentState() to crash
//             // after the SDK reconnects and creates a new internal player object.
//             const activePlayer = playerRef.current;
//             if (!activePlayer || isPaused || isSeekingRef.current) return;

//             try {
//                 const state = await activePlayer?.getCurrentState();
//                 if (state && !state.paused && !isSeekingRef.current) {
//                     const newPosition = state.position;
//                     setCurrentPosition(prev => {
//                         if (Math.abs(newPosition - prev) > 50) return newPosition;
//                         return prev;
//                     });
//                 }
//             } catch (err) {
//                 // FIX: if player died mid-interval, stop polling instead of
//                 // silently ignoring — prevents a cascade of errors
//                 stopProgressUpdates();
//             }
//         }, 500); // Poll every 500ms — smooth enough for a progress bar
//     };


//     const stopProgressUpdates = () => {
//         if (progressIntervalRef.current) {
//             clearInterval(progressIntervalRef.current);
//             progressIntervalRef.current = null;
//         }
//     };

//     // Handle progress bar click for seeking
//     const handleProgressBarClick = async (e) => {
//         if (!player || !isPlayerReady) return;

//         const progressBar = e.currentTarget;
//         const rect = progressBar.getBoundingClientRect();
//         const clickX = e.clientX - rect.left;
//         const percentage = Math.max(0, Math.min(1, clickX / rect.width));
//         const seekPosition = percentage * duration;

//         console.log(`Seeking to ${formatDuration(seekPosition)} (${percentage * 100}%)`);

//         // Set seeking flag to prevent conflicts
//         isSeekingRef.current = true;

//         try {
//             // Perform the seek
//             await player.seek(seekPosition);
//             setCurrentPosition(seekPosition);
//             lastPositionRef.current = seekPosition;

//             // Small delay to ensure seek completes
//             setTimeout(() => {
//                 isSeekingRef.current = false;
//             }, 200);
//         } catch (error) {
//             console.error("Error seeking:", error);
//             isSeekingRef.current = false;
//         }
//     };

//     useEffect(() => {
//         if (playlistUris && playlistUris.length > 0) {
//             setCurrentPlaylist(playlistUris);
//             console.log("Playlist loaded with", playlistUris.length, "tracks");
//         }
//     }, [playlistUris]);



//     const handlePlay = async (trackUri, contextUris = null, deviceIdParam = null) => {
//         const activeDeviceId = deviceIdParam || deviceId;

//         if (!activeDeviceId) {
//             console.error("No device ID available");
//             return;
//         }

//         const uris = (contextUris && contextUris.length > 0) ? contextUris : [trackUri];
//         try {
//             const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`, {
//                 method: "PUT",
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     "Content-Type": "application/json",
//                 },

//                 body: JSON.stringify({
//                     uris: uris,           // ✅ was: urisToPlay (undefined)
//                     offset: { uri: trackUri }, //
//                 })
//             });

//             if (response.ok) {
//                 console.log("Single track playback started");
//                 // Reset position for new track
//                 setCurrentPosition(0);
//                 lastPositionRef.current = 0;

//             } else {
//                 const error = await response.json();
//                 console.error("Failed to start playback:", error);
//             }
//         } catch (error) {
//             console.error("Error in handlePlay:", error);
//         }
//     }


//     const togglePlay = () => {
//         if (!player || !isPlayerReady) {
//             console.warn("Player not ready yet");
//             return;
//         }

//         player.togglePlay()
//             .then(() => {
//                 console.log("Toggle play successful");
//             })
//             .catch(error => {
//                 console.error("Error toggling play:", error);
//             });
//     };

//     const nextTrack = () => {
//         if (!player || !isPlayerReady) {
//             console.warn("Player not ready yet");
//             return;
//         }

//         player.nextTrack()
//             .then(() => {
//                 console.log("Next track requested");
//                 // Reset position for new track
//                 setCurrentPosition(0);
//                 lastPositionRef.current = 0;
//             })
//             .catch(error => {
//                 console.error("Error switching to next track:", error);
//             });
//     };

//     const prevTrack = () => {
//         if (!player || !isPlayerReady) {
//             console.warn("Player not ready yet");
//             return;
//         }

//         player.previousTrack()
//             .then(() => {
//                 console.log("Previous track requested");
//                 // Reset position for new track
//                 setCurrentPosition(0);
//                 lastPositionRef.current = 0;
//             })
//             .catch(error => {
//                 console.error("Error switching to previous track:", error);
//             });
//     };

//     const formatDuration = (ms) => {
//         if (!ms || isNaN(ms)) return "0:00";
//         const minutes = Math.floor(ms / 60000);
//         const seconds = Math.floor((ms % 60000) / 1000);
//         return `${minutes}:${seconds.toString().padStart(2, '0')}`;
//     };

//     // Calculate progress percentage
//     const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;

//     React.useEffect(() => {
//         if (onReady && deviceId) {
//             if (window.__webPlaybackHandlePlay) {
//                 window.__webPlaybackHandlePlay = handlePlay;
//             }
//         }
//     }, [deviceId, token]);


    

//     return (
//         <div className="fixed bottom-0 w-full bg-[#1E2A3E] p-4 flex items-center justify-evenly z-50 shadow-lg">
//             {/* Track Info */}
//             <div className="flex items-center gap-4 flex-1 min-w-0">
//                 {currentTrack?.album?.images?.[0]?.url && (
//                     <img
//                         src={currentTrack.album.images[0].url}
//                         className="w-[56px] h-[56px] rounded-lg object-cover shadow-md"
//                         alt="Album art"
//                     />
//                 )}
//                 <div className="min-w-0 flex-1">
//                     <p className="text-white font-bold truncate">{currentTrack?.name ?? "No track playing"}</p>
//                     <p className="text-gray-400 text-sm truncate">
//                         {currentTrack?.artists?.map(a => a.name).join(", ") ?? "Select a song to play"}
//                     </p>
//                 </div>
//             </div>

//             {/* Progress Bar Section */}
//             <div className="flex flex-col items-center gap-2 flex-1 max-w-[400px]">
//                 <div
//                     className="w-full relative cursor-pointer group"
//                     onClick={handleProgressBarClick}
//                 >
//                     {/* Background bar */}
//                     <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
//                         {/* Progress fill */}
//                         <div
//                             className="h-full bg-amber-200 rounded-full transition-all duration-75 relative"
//                             style={{ width: `${progressPercentage}%` }}
//                         >
//                             {/* Progress handle/knob - shows on hover */}
//                             <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-amber-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ right: '-4px' }}></div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Time indicators */}
//                 <div className="flex justify-between w-full text-xs text-gray-400">
//                     <span>{formatDuration(currentPosition)}</span>
//                     <span>{formatDuration(duration)}</span>
//                 </div>

//                 {/* Controls */}
//                 <div className="flex items-center gap-6 mt-1">
//                     <button
//                         onClick={prevTrack}
//                         className="text-white text-2xl hover:text-amber-200 transition-colors"
//                         disabled={!isPlayerReady}
//                     >
//                         ⏮
//                     </button>
//                     <button
//                         onClick={togglePlay}
//                         className="bg-amber-200 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center text-xl hover:scale-105 transition-transform"
//                         disabled={!isPlayerReady}
//                     >
//                         {isPaused ? "▶" : "⏸"}
//                     </button>
//                     <button
//                         onClick={nextTrack}
//                         className="text-white text-2xl hover:text-amber-200 transition-colors"
//                         disabled={!isPlayerReady}
//                     >
//                         ⏭
//                     </button>
//                 </div>
//             </div>

//             {/* Track counter */}
//             <div className="w-20 text-right">
//                 {currentPlaylist.length > 0 && (
//                     <div className="text-gray-500 text-xs">
//                         {currentTrackIndex + 1}/{currentPlaylist.length}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
