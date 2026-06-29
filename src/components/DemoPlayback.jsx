import React, { useState, useEffect, useRef, useCallback } from "react";
import { DEMO_TRACKS, DEMO_PLAYLIST_URIS, findDemoTrack } from "../data/demoPlaylist";

/**
 * DemoPlayback — HTML5 Audio-based player for non-premium Spotify users.
 * Mirrors the WebPlayback component interface so it integrates seamlessly
 * with the room sync system.
 */
export default function DemoPlayback({
    playlistTracks: externalTracks,
    playlistUris: externalUris,
    incomingCommand,
    incomingProgress,
    localTrackCommand,
    onRoomCommand,
    onSendProgress,
}) {
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);

    const audioRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const lastRoomCommandIdRef = useRef(null);

    // Use demo tracks as the playlist
    const playlist = DEMO_TRACKS;
    const playlistUris = DEMO_PLAYLIST_URIS;

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio();
        audio.volume = volume;
        audioRef.current = audio;

        audio.addEventListener("loadedmetadata", () => {
            setDuration(audio.duration * 1000); // convert to ms
        });

        audio.addEventListener("ended", () => {
            // Auto-advance to next track
            handleNextTrack();
        });

        audio.addEventListener("error", (e) => {
            console.warn("Demo audio error:", e);
        });

        return () => {
            audio.pause();
            audio.src = "";
            audioRef.current = null;
        };
    }, []);

    // Progress tracking
    useEffect(() => {
        if (!isPaused) {
            progressIntervalRef.current = setInterval(() => {
                if (audioRef.current && !audioRef.current.paused) {
                    setCurrentPosition(audioRef.current.currentTime * 1000);
                }
            }, 500);
        } else {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPaused]);

    // Sync volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const loadAndPlayTrack = useCallback((track, positionMs = 0) => {
        if (!audioRef.current || !track) return;

        const audio = audioRef.current;
        audio.src = track.audioSrc;
        audio.currentTime = positionMs / 1000;

        setCurrentTrack(track);
        setDuration(track.durationMs || 0);
        setCurrentPosition(positionMs);
        setIsPaused(false);

        const index = playlist.findIndex((t) => t.uri === track.uri);
        if (index !== -1) setCurrentTrackIndex(index);

        audio.play().catch((err) => {
            console.warn("Demo playback autoplay blocked:", err);
            setIsPaused(true);
        });
    }, [playlist]);

    const handleNextTrack = useCallback(() => {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        const nextTrack = playlist[nextIndex];
        loadAndPlayTrack(nextTrack);
        onRoomCommand?.({
            type: "playTrack",
            trackUri: nextTrack.uri,
            playlistUris,
            track: nextTrack,
            positionMs: 0,
        });
    }, [currentTrackIndex, playlist, playlistUris, loadAndPlayTrack, onRoomCommand]);

    const handlePrevTrack = useCallback(() => {
        const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        const prevTrack = playlist[prevIndex];
        loadAndPlayTrack(prevTrack);
        onRoomCommand?.({
            type: "playTrack",
            trackUri: prevTrack.uri,
            playlistUris,
            track: prevTrack,
            positionMs: 0,
        });
    }, [currentTrackIndex, playlist, playlistUris, loadAndPlayTrack, onRoomCommand]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;

        if (!currentTrack) {
            // Start playing first track if nothing is loaded
            loadAndPlayTrack(playlist[0]);
            onRoomCommand?.({
                type: "playTrack",
                trackUri: playlist[0].uri,
                playlistUris,
                track: playlist[0],
                positionMs: 0,
            });
            return;
        }

        if (isPaused) {
            audioRef.current.play().catch(console.warn);
            setIsPaused(false);
            onRoomCommand?.({ type: "play" });
        } else {
            audioRef.current.pause();
            setIsPaused(true);
            onRoomCommand?.({ type: "pause" });
        }
    }, [isPaused, currentTrack, playlist, playlistUris, loadAndPlayTrack, onRoomCommand]);

    const handleSeek = useCallback((percent) => {
        if (!audioRef.current || !duration) return;

        const positionMs = Math.floor(duration * percent);
        audioRef.current.currentTime = positionMs / 1000;
        setCurrentPosition(positionMs);

        onRoomCommand?.({
            type: "seek",
            positionMs,
        });
    }, [duration, onRoomCommand]);

    const handleProgressBarClick = (e) => {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        handleSeek(percent);
    };

    const handleVolumeChange = (e) => {
        const nextVolume = parseFloat(e.target.value);
        setVolume(nextVolume);
    };

    const handleVolumeCommit = () => {
        onRoomCommand?.({
            type: "volume",
            volume,
        });
    };

    // Execute incoming room commands
    const executeRoomCommand = useCallback(async (command) => {
        if (!command) return false;

        if (command.type === "playTrack") {
            const track = findDemoTrack(command.trackUri) || command.track;
            if (track?.audioSrc) {
                loadAndPlayTrack(track, command.positionMs || 0);
            }
            return true;
        }

        if (command.type === "play") {
            if (audioRef.current && currentTrack) {
                audioRef.current.play().catch(console.warn);
                setIsPaused(false);
            }
            return true;
        }

        if (command.type === "pause") {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsPaused(true);
            }
            return true;
        }

        if (command.type === "seek" && typeof command.positionMs === "number") {
            if (audioRef.current) {
                audioRef.current.currentTime = command.positionMs / 1000;
                setCurrentPosition(command.positionMs);
            }
            return true;
        }

        if (command.type === "next") {
            const nextIndex = (currentTrackIndex + 1) % playlist.length;
            loadAndPlayTrack(playlist[nextIndex]);
            return true;
        }

        if (command.type === "previous") {
            const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            loadAndPlayTrack(playlist[prevIndex]);
            return true;
        }

        if (command.type === "volume" && typeof command.volume === "number") {
            setVolume(Math.max(0, Math.min(1, command.volume)));
            return true;
        }

        return false;
    }, [currentTrack, currentTrackIndex, playlist, loadAndPlayTrack]);

    // Handle incoming room commands
    useEffect(() => {
        if (!incomingCommand || incomingCommand.id === lastRoomCommandIdRef.current) return;

        executeRoomCommand(incomingCommand).then((handled) => {
            if (handled) {
                lastRoomCommandIdRef.current = incomingCommand.id;
            }
        });
    }, [incomingCommand, executeRoomCommand]);

    // Handle local track commands (from MusicCard clicks)
    useEffect(() => {
        if (!localTrackCommand || localTrackCommand.id === lastRoomCommandIdRef.current) return;

        const track = findDemoTrack(localTrackCommand.trackUri) || localTrackCommand.track;
        if (track?.audioSrc) {
            loadAndPlayTrack(track, localTrackCommand.positionMs || 0);
        }
        lastRoomCommandIdRef.current = localTrackCommand.id;
    }, [localTrackCommand, loadAndPlayTrack]);

    // Send progress updates to room every 2 seconds while playing
    useEffect(() => {
        if (isPaused || !currentTrack || !onSendProgress) return;

        const progressBroadcast = setInterval(() => {
            if (audioRef.current && !audioRef.current.paused) {
                onSendProgress({
                    positionMs: Math.floor(audioRef.current.currentTime * 1000),
                    duration: duration,
                    trackUri: currentTrack?.uri || '',
                    isPaused: false,
                });
            }
        }, 2000);

        return () => clearInterval(progressBroadcast);
    }, [isPaused, currentTrack, duration, onSendProgress]);

    // Receive progress updates from other room members
    useEffect(() => {
        if (!incomingProgress) return;

        // Update position from remote user's progress
        const { positionMs, duration: remoteDuration, trackUri, isPaused: remoteIsPaused } = incomingProgress;

        // If the remote is playing a different track, try to switch to it
        if (trackUri && currentTrack?.uri !== trackUri) {
            const track = findDemoTrack(trackUri);
            if (track?.audioSrc) {
                loadAndPlayTrack(track, positionMs || 0);
                return;
            }
        }

        // Sync position — only adjust if difference is > 3 seconds (avoid jitter)
        if (typeof positionMs === 'number' && audioRef.current) {
            const localPos = audioRef.current.currentTime * 1000;
            const diff = Math.abs(localPos - positionMs);
            if (diff > 3000) {
                audioRef.current.currentTime = positionMs / 1000;
                setCurrentPosition(positionMs);
            }
        }

        // Sync duration if we don't have it
        if (remoteDuration && !duration) {
            setDuration(remoteDuration);
        }

        // Sync play/pause state
        if (remoteIsPaused && !isPaused && audioRef.current) {
            audioRef.current.pause();
            setIsPaused(true);
        } else if (!remoteIsPaused && isPaused && audioRef.current && currentTrack) {
            audioRef.current.play().catch(console.warn);
            setIsPaused(false);
        }
    }, [incomingProgress]);

    // Helpers
    const formatDuration = (ms) => {
        if (!ms || isNaN(ms)) return "0:00";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-[#1E2A3E] p-3 shadow-lg md:flex-row md:items-center md:justify-evenly md:p-4">
            {/* Track Info */}
            <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                {currentTrack?.albumImageUrl && (
                    <img
                        src={currentTrack.albumImageUrl}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-md md:h-14 md:w-14"
                        alt="Album art"
                    />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-white font-bold truncate">
                        {currentTrack?.name ?? "No track playing"}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                        {currentTrack?.artistName ?? "Select a song to play"}
                    </p>
                </div>
                {/* Demo mode badge */}
                <span className="hidden shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 sm:inline-block">
                    DEMO MODE
                </span>
            </div>

            {/* Progress Bar Section */}
            <div className="flex w-full flex-col items-center gap-2 md:max-w-[400px] md:flex-1">
                <div
                    className="w-full relative cursor-pointer group"
                    onClick={handleProgressBarClick}
                >
                    <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-75 relative"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ right: "-4px" }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between w-full text-xs text-gray-400">
                    <span>{formatDuration(currentPosition)}</span>
                    <span>{formatDuration(duration)}</span>
                </div>

                <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-4 sm:gap-6">
                    <button
                        onClick={handlePrevTrack}
                        className="text-2xl text-white transition-colors hover:text-emerald-400"
                    >
                        ⏮
                    </button>
                    <button
                        onClick={togglePlay}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-xl text-slate-900 transition-transform hover:scale-105 md:h-12 md:w-12"
                    >
                        {isPaused ? "▶" : "⏸"}
                    </button>
                    <button
                        onClick={handleNextTrack}
                        className="text-2xl text-white transition-colors hover:text-emerald-400"
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
                        />
                        <span className="text-gray-400 text-xs">{Math.round(volume * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Track counter */}
            <div className="absolute right-3 top-3 text-right md:static md:w-20">
                {playlist.length > 0 && (
                    <div className="text-gray-500 text-xs">
                        {currentTrackIndex + 1}/{playlist.length}
                    </div>
                )}
            </div>
        </div>
    );
}
