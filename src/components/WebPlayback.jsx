import React, { useState, useEffect, useRef, useCallback } from "react";

const SPOTIFY_SDK_SCRIPT_ID = "spotify-web-playback-sdk";
const SPOTIFY_PLAYER_GLOBAL_KEY = "__musicplayerSpotifyPlayer";
const SPOTIFY_DEVICE_GLOBAL_KEY = "__webPlaybackDeviceId";

const loadSpotifySdk = (onReady) => {
    window.onSpotifyWebPlaybackSDKReady = onReady;

    if (window.Spotify?.Player) {
        onReady();
        return;
    }

    if (document.getElementById(SPOTIFY_SDK_SCRIPT_ID)) {
        return;
    }

    const sdkScript = document.createElement("script");
    sdkScript.id = SPOTIFY_SDK_SCRIPT_ID;
    sdkScript.src = "https://sdk.scdn.co/spotify-player.js";
    sdkScript.async = true;
    document.body.appendChild(sdkScript);
};

export default function WebPlayback({
    token,
    onReady,
    onNotReady,
    onPlayerStateChange,
    playlistUris,
    playlistTracks = [],
    incomingCommand,
    localTrackCommand,
    onRoomCommand,
}) {

    // Removed unused player state variable
    const [deviceId, setDeviceId] = useState(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5); // Volume state (0.0 to 1.0)
    const currentPlaylist = playlistUris?.length
        ? playlistUris
        : playlistTracks.map((track) => track.uri).filter(Boolean);

    // Progress bar states
    const [currentPosition, setCurrentPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const progressIntervalRef = useRef(null);
    const volumeUpdateTimeoutRef = useRef(null);
    const lastPositionRef = useRef(0);
    const isSeekingRef = useRef(false);
    //const [volume, setVolume] = useState(0.5); // Volume state (0.0 to 1.0)

    // Refs for objects that need to be consistently updated
    const playerRef = useRef(null);
    const currentPlaylistRef = useRef(currentPlaylist);
    const playlistTracksRef = useRef(playlistTracks);
    const lastProcessedStateRef = useRef(null);
    const stateTimeoutRef = useRef(null);
    const hasInitialState = useRef(false);
    const lastState = useRef(null);
    const lastRoomCommandIdRef = useRef(null);

    // Use Spotify Web API for controls because SDK control methods can become unstable after reconnects.
    const buildDeviceQuery = (deviceIdParam = deviceId) => (
        deviceIdParam ? `?device_id=${encodeURIComponent(deviceIdParam)}` : ""
    );

    const normalizeDisplayTrack = (track, fallbackUri = '') => {
        if (!track) return null;
        if (track.album || track.artists) return track;

        return {
            id: track.id || fallbackUri,
            uri: track.uri || fallbackUri,
            name: track.name || 'Unknown track',
            duration_ms: track.duration_ms || track.durationMs || 0,
            artists: [{ name: track.artistName || 'Unknown Artist' }],
            album: {
                images: track.albumImageUrl ? [{ url: track.albumImageUrl }] : [],
            },
        };
    };

    const findPlaylistTrack = (trackUri) => (
        playlistTracksRef.current.find((track) => track.uri === trackUri)
    );

    const showTrackFromRoomCommand = (command) => {
        const nextPlaylist = command.playlistUris?.length ? command.playlistUris : currentPlaylistRef.current;
        const trackUri = command.trackUri;
        const track = normalizeDisplayTrack(command.track || findPlaylistTrack(trackUri), trackUri);
        const index = nextPlaylist.findIndex((uri) => uri === trackUri);

        if (nextPlaylist.length > 0) {
            currentPlaylistRef.current = nextPlaylist;
        }

        if (track) {
            setCurrentTrack(track);
            setDuration(track.duration_ms || 0);
        }

        if (index !== -1) {
            setCurrentTrackIndex(index);
        }

        const nextPosition = command.positionMs || 0;
        setCurrentPosition(nextPosition);
        lastPositionRef.current = nextPosition;
        setIsPaused(false);
    };

    const sendSpotifyCommand = async (path, options = {}) => {
        if (!token) {
            console.error("No token available for Spotify command");
            return null;
        }

        const response = await fetch(`https://api.spotify.com/v1/me/player/${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (!response.ok && response.status !== 204) {
            let errorDetails = "";
            try {
                const error = await response.json();
                errorDetails = error.error?.message || JSON.stringify(error);
            } catch {
                errorDetails = response.statusText;
            }
            console.warn(`Spotify command failed (${response.status}): ${errorDetails}`);
        }

        return response;
    };

    // NEW: handleSeek — seeks by percentage (0.0 to 1.0)
    // Uses lastState.current for duration so no stale closure issues
    const handleSeek = async (percent) => {
        if (!lastState.current || !lastState.current.track_window?.current_track || !deviceId) return;
        const trackDuration = lastState.current.duration;
        const positionMs = Math.floor(trackDuration * percent);
        await sendSpotifyCommand(
            `seek?position_ms=${positionMs}&device_id=${encodeURIComponent(deviceId)}`,
            { method: "PUT" }
        );
        return positionMs;
    };

    const updateSpotifyVolume = useCallback(async (nextVolume) => {
        const clampedVolume = Math.max(0, Math.min(1, nextVolume));

        if (!playerRef.current) return;

        if (volumeUpdateTimeoutRef.current) {
            clearTimeout(volumeUpdateTimeoutRef.current);
        }

        volumeUpdateTimeoutRef.current = setTimeout(async () => {
            try {
                await playerRef.current?.setVolume?.(clampedVolume);
            } catch (error) {
                console.warn("Failed to set Spotify SDK volume:", error);
            }
        }, 150);
    }, []);

    const handleVolumeChange = (e) => {
        const nextVolume = parseFloat(e.target.value);
        setVolume(nextVolume);
    };

    const handleVolumeCommit = () => {
        onRoomCommand?.({
            type: 'volume',
            volume,
        });
    };

    // Keep Spotify volume in sync when the player/device becomes ready.
    useEffect(() => {
        updateSpotifyVolume(volume);
    }, [updateSpotifyVolume, volume]);

    useEffect(() => {
        currentPlaylistRef.current = currentPlaylist;
    }, [playlistUris, playlistTracks]);

    useEffect(() => {
        playlistTracksRef.current = playlistTracks || [];
    }, [playlistTracks]);

    function startSmoothProgressUpdates() {
        if (progressIntervalRef.current) {
            console.log("Progress interval already running, skipping...");
            return;
        }

        console.log("Starting smooth progress updates...");

        progressIntervalRef.current = setInterval(() => {
            if (isPaused || isSeekingRef.current) {
                return;
            }

            setCurrentPosition(prev => {
                const nextPosition = Math.min(prev + 500, duration);
                lastPositionRef.current = nextPosition;
                return nextPosition;
            });
        }, 500);
        
        console.log("Progress interval started with ID:", progressIntervalRef.current);
    }

    function stopProgressUpdates() {
        if (progressIntervalRef.current) {
            console.log("Stopping progress updates, clearing interval ID:", progressIntervalRef.current);
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }


    useEffect(() => {
        if (!token) return;

        let playerInitialized = false;
        const initializeSpotifyPlayer = () => {
            if (playerInitialized || !window.Spotify?.Player) return;
            playerInitialized = true;

            if (window[SPOTIFY_PLAYER_GLOBAL_KEY]) {
                console.log("Reusing existing Spotify Web Playback player...");
                const spotifyPlayer = window[SPOTIFY_PLAYER_GLOBAL_KEY];
                playerRef.current = spotifyPlayer;
                window.__webPlaybackActivateElement = () => {
                    return spotifyPlayer.activateElement?.();
                };

                const existingDeviceId = window[SPOTIFY_DEVICE_GLOBAL_KEY];
                if (existingDeviceId) {
                    setDeviceId(existingDeviceId);
                    setIsPlayerReady(true);
                    onReady?.(existingDeviceId);
                }

                spotifyPlayer.addListener("player_state_changed", (state) => {
                    if (!state) return;

                    hasInitialState.current = true;
                    lastState.current = state;
                    setCurrentTrack(state.track_window.current_track);
                    setIsPaused(state.paused);
                    setDuration(state.duration);
                    setCurrentPosition(state.position);
                    lastPositionRef.current = state.position;
                    onPlayerStateChange?.(state);
                });

                spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                    if (window[SPOTIFY_DEVICE_GLOBAL_KEY] === device_id) {
                        delete window[SPOTIFY_DEVICE_GLOBAL_KEY];
                    }
                    setDeviceId(null);
                    setIsPlayerReady(false);
                    stopProgressUpdates();
                    onNotReady?.(device_id);
                });

                return;
            }

            console.log("Spotify SDK ready, creating player...");

            const spotifyPlayer = new window.Spotify.Player({
                name: "My Music Player",
                getOAuthToken: (cb) => cb(token),
                volume: volume, // Use volume state
            });
            window[SPOTIFY_PLAYER_GLOBAL_KEY] = spotifyPlayer;

            // NEW: start playback as soon as player is ready
            spotifyPlayer.addListener("ready", async ({ device_id }) => {
                console.log("=== PLAYER READY ===");
                console.log("Player ready with Device ID:", device_id);
                console.log("Playlist URIs available:", playlistUris?.length);
                window[SPOTIFY_DEVICE_GLOBAL_KEY] = device_id;

                setDeviceId(device_id);
                setIsPlayerReady(true);

                if (onReady) onReady(device_id);
            });

            // FIX: use spotifyPlayer (not player which is null here)
            // NEW: also mirrors the pattern from the snippet — setState(state) equivalent
            spotifyPlayer.addListener("player_state_changed", (state) => {
                if (!state) {
                    console.warn("Empty state received in player_state_changed");
                    return;
                }

                console.log("Player state changed event fired", {
                    track: state.track_window?.current_track?.name,
                    paused: state.paused,
                    position: state.position,
                    duration: state.duration
                });

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

                        if (currentPlaylistRef.current.length > 0 && state.track_window.current_track?.uri) {
                            const index = currentPlaylistRef.current.findIndex(uri => uri === state.track_window.current_track.uri);
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
            });

            spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                console.log("Device has gone offline:", device_id);
                if (window[SPOTIFY_DEVICE_GLOBAL_KEY] === device_id) {
                    delete window[SPOTIFY_DEVICE_GLOBAL_KEY];
                }
                setDeviceId(null);
                setIsPlayerReady(false);
                stopProgressUpdates();
                onNotReady?.(device_id);
            });

            spotifyPlayer.addListener("playback_error", ({ message }) => {
                console.error("Playback Error:", message);
            });

            spotifyPlayer.connect().then(success => {
                if (success) {
                    console.log("🎉 WebPlayback CONNECTED successfully!");

                } else {
                    console.error("❌ WebPlayback connection FAILED");
                }
            });

            playerRef.current = spotifyPlayer;
            window.__webPlaybackActivateElement = () => {
                return spotifyPlayer.activateElement?.();
            };
        };

        loadSpotifySdk(initializeSpotifyPlayer);

        return () => {
            if (stateTimeoutRef.current) {
                clearTimeout(stateTimeoutRef.current);
            }
            if (volumeUpdateTimeoutRef.current) {
                clearTimeout(volumeUpdateTimeoutRef.current);
            }
            stopProgressUpdates();
            if (playerRef.current) {
                [
                    "ready",
                    "player_state_changed",
                    "initialization_error",
                    "authentication_error",
                    "account_error",
                    "not_ready",
                    "playback_error",
                ].forEach((eventName) => {
                    playerRef.current?.removeListener?.(eventName);
                });
            }
            // FIX: use ref for cleanup — state may already be stale by the time
            // the cleanup function runs (common with async SDK initialization)
            playerRef.current = null;
            if (window.__webPlaybackActivateElement) {
                delete window.__webPlaybackActivateElement;
            }
        };
    }, [token]);


    useEffect(() => {
        console.log("Progress effect triggered:", { isPaused, isPlayerReady, duration, hasPlayerRef: !!playerRef.current });
        
        if (!isPaused && duration > 0) {
            console.log("Starting progress updates...");
            startSmoothProgressUpdates();
        } else {
            console.log("Stopping progress updates (conditions not met)");
            stopProgressUpdates();
        }
    
        return () => {
            stopProgressUpdates();
        };
    }, [isPaused, isPlayerReady, duration]); // Using playerRef.current inside effect, not in deps


    // NEW: startPlayback — wraps /me/player/play, called on ready
    // UPDATED: handleProgressBarClick now uses handleSeek(percent) internally
    const handleProgressBarClick = async (e) => {
        if (!isPlayerReady || !lastState.current || !deviceId) return;

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));

        console.log(`Seeking to ${(percent * 100).toFixed(1)}%`);

        isSeekingRef.current = true;

        try {
            // NEW: delegate to handleSeek(percent) instead of safeSeekRef directly
            const seekPosition = await handleSeek(percent);
            setCurrentPosition(seekPosition);
            lastPositionRef.current = seekPosition;
            onRoomCommand?.({
                type: 'seek',
                positionMs: seekPosition,
            });

            setTimeout(() => {
                isSeekingRef.current = false;
            }, 200);
        } catch (error) {
            console.error("Error seeking:", error);
            isSeekingRef.current = false;
        }
    };

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
                setIsPaused(false);

            } else {
                const error = await response.json();
                console.error("Failed to start playback:", error);
            }
        } catch (error) {
            console.error("Error in handlePlay:", error);
        }
    };

    const executeRoomCommand = async (command) => {
        if (!command) return false;

        if (command.type === 'playTrack') {
            showTrackFromRoomCommand(command);

            if (deviceId && isPlayerReady) {
                await handlePlay(command.trackUri, command.playlistUris, deviceId);
            }

            if (deviceId && isPlayerReady && typeof command.positionMs === 'number' && command.positionMs > 0) {
                await sendSpotifyCommand(
                    `seek?position_ms=${command.positionMs}&device_id=${encodeURIComponent(deviceId)}`,
                    { method: "PUT" }
                );
            }

            return true;
        }

        if (command.type === 'play' || command.type === 'pause') {
            setIsPaused(command.type === 'pause');

            if (deviceId && isPlayerReady) {
                await sendSpotifyCommand(`${command.type}${buildDeviceQuery()}`, { method: "PUT" });
            }

            return true;
        }

        if (command.type === 'seek' && typeof command.positionMs === 'number') {
            setCurrentPosition(command.positionMs);
            lastPositionRef.current = command.positionMs;

            if (deviceId && isPlayerReady) {
                await sendSpotifyCommand(
                    `seek?position_ms=${command.positionMs}&device_id=${encodeURIComponent(deviceId)}`,
                    { method: "PUT" }
                );
            }

            return true;
        }

        if (command.type === 'next' || command.type === 'previous') {
            if (deviceId && isPlayerReady) {
                await sendSpotifyCommand(`${command.type}${buildDeviceQuery()}`, { method: "POST" });
            }
            setCurrentPosition(0);
            lastPositionRef.current = 0;
            return true;
        }

        if (command.type === 'volume' && typeof command.volume === 'number') {
            setVolume(Math.max(0, Math.min(1, command.volume)));
            return true;
        }

        return true;
    };

    useEffect(() => {
        if (!incomingCommand || incomingCommand.id === lastRoomCommandIdRef.current) return;

        window.setTimeout(() => {
            executeRoomCommand(incomingCommand).then((handled) => {
                if (handled) {
                    lastRoomCommandIdRef.current = incomingCommand.id;
                }
            });
        }, 0);
    }, [incomingCommand, deviceId, isPlayerReady]);

    useEffect(() => {
        if (!localTrackCommand || localTrackCommand.id === lastRoomCommandIdRef.current) return;

        showTrackFromRoomCommand(localTrackCommand);
        lastRoomCommandIdRef.current = localTrackCommand.id;
    }, [localTrackCommand]);


    const togglePlay = async () => {
        console.log("togglePlay called, isPlayerReady:", isPlayerReady, "isPaused:", isPaused);
        const command = isPaused ? "play" : "pause";
    
        if (!isPlayerReady) {
            if (onRoomCommand) {
                onRoomCommand({ type: command });
                setIsPaused(!isPaused);
            }
            console.warn("Player not ready yet");
            return;
        }
    
        try {
            const response = await sendSpotifyCommand(`${command}${buildDeviceQuery()}`, { method: "PUT" });

            if (response?.ok || response?.status === 204) {
                setIsPaused(!isPaused);
                onRoomCommand?.({
                    type: command,
                });
            }
            
        } catch (error) {
            console.error("Error in togglePlay:", error);
        }
    };

    const playPlaylistTrack = async (trackUri, playlist = currentPlaylistRef.current) => {
        const track = findPlaylistTrack(trackUri);
        const command = {
            type: 'playTrack',
            trackUri,
            playlistUris: playlist,
            track,
            positionMs: 0,
        };

        showTrackFromRoomCommand(command);

        if (deviceId && isPlayerReady) {
            await handlePlay(trackUri, playlist, deviceId);
        }

        onRoomCommand?.(command);
    };

    const playAdjacentTrack = async (direction) => {
        const playlist = currentPlaylistRef.current.length > 0
            ? currentPlaylistRef.current
            : currentPlaylist;

        if (playlist.length === 0) {
            onRoomCommand?.({ type: direction });

            if (deviceId && isPlayerReady) {
                await sendSpotifyCommand(`${direction}${buildDeviceQuery()}`, { method: "POST" });
                setCurrentPosition(0);
                lastPositionRef.current = 0;
            }

            return;
        }

        const activeUri = currentTrack?.uri;
        const activeIndex = playlist.findIndex((uri) => uri === activeUri);
        const baseIndex = activeIndex === -1 ? currentTrackIndex : activeIndex;
        const offset = direction === 'next' ? 1 : -1;
        const nextIndex = (baseIndex + offset + playlist.length) % playlist.length;

        await playPlaylistTrack(playlist[nextIndex], playlist);
    };

    const nextTrack = async () => {
        console.log("nextTrack called");

        try {
            await playAdjacentTrack('next');
            console.log("Next track requested successfully");
        } catch (error) {
            console.error("Error switching to next track:", error);
        }
    };

    const prevTrack = async () => {
        console.log("prevTrack called");

        try {
            await playAdjacentTrack('previous');
            console.log("Previous track requested successfully");
        } catch (error) {
            console.error("Error switching to previous track:", error);
        }
    };

    const formatDuration = (ms) => {
        if (!ms || isNaN(ms)) return "0:00";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;
    const currentTrackImageUrl = currentTrack?.album?.images?.[0]?.url || currentTrack?.albumImageUrl;

    React.useEffect(() => {
        if (onReady && deviceId) {
            if (window.__webPlaybackHandlePlay) {
                window.__webPlaybackHandlePlay = handlePlay;
            }
        }
    }, [deviceId, token]);


    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-[#1E2A3E] p-3 shadow-lg md:flex-row md:items-center md:justify-evenly md:p-4">
            {/* Track Info */}
            <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                {currentTrackImageUrl && (
                    <img
                        src={currentTrackImageUrl}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-md md:h-14 md:w-14"
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
            <div className="flex w-full flex-col items-center gap-2 md:max-w-[400px] md:flex-1">
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

                <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-4 sm:gap-6">
                    <button
                        onClick={prevTrack}
                        className="text-2xl text-white transition-colors hover:text-amber-200"
                        disabled={!isPlayerReady && !onRoomCommand}
                    >
                        ⏮
                    </button>
                    <button
                        onClick={togglePlay}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-200 text-xl text-slate-900 transition-transform hover:scale-105 md:h-12 md:w-12"
                        disabled={!isPlayerReady && !onRoomCommand}
                    >
                        {isPaused ? "▶" : "⏸"}
                    </button>
                    <button
                        onClick={nextTrack}
                        className="text-2xl text-white transition-colors hover:text-amber-200"
                        disabled={!isPlayerReady && !onRoomCommand}
                    >
                        ⏭
                    </button>
                    
                    {/* Volume Control */}
                    <div className="hidden items-center gap-2 sm:flex">
                        <span className="text-gray-400 text-xs">🔊</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onInput={handleVolumeChange}
                            onChange={handleVolumeChange}
                            onPointerUp={handleVolumeCommit}
                            onKeyUp={handleVolumeCommit}
                            className="w-24"
                        ></input>
                        <span className="text-gray-400 text-xs">{Math.round(volume * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Track counter */}
            <div className="absolute right-3 top-3 text-right md:static md:w-20">
                {currentPlaylist.length > 0 && (
                    <div className="text-gray-500 text-xs">
                        {currentTrackIndex + 1}/{currentPlaylist.length}
                    </div>
                )}
            </div>
        </div>
    );
}
