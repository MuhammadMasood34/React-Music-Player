import React, { useState, useEffect, useCallback, useRef } from 'react'
import Screencontainer from '../shared/screencontainer'
import MusicCard from '../components/MusicCard'
import DemoMusicCard from '../components/DemoMusicCard'
import { useLocation } from 'react-router-dom'

export default function Players({
  token,
  currentDeviceId,
  setCurrentDeviceId,
  setIsPlaying,
  setPlaylistUris,
  playlistTracks,
  setPlaylistTracks,
  setLocalTrackCommand,
  roomSync,
  isDemoMode = false,
}) {
  const location = useLocation();
  const selectedPlaylistId = location.state?.playlistId || "6nqDE6AngPtfuY2JmOILXw";

  const [joinCode, setJoinCode] = useState('');
  const {
    roomCode,
    userCount,
    sharedPlaylist,
    error: roomError,
    isConnected: roomConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    sendPlaylist,
    sendCommand,
  } = roomSync;

  useEffect(() => {
    console.log("Token in Players:", token ? "Present" : "Missing");
  }, [token]);

  // In Players.jsx, modify handleTrackSelect
  // In Players.jsx - Update handleTrackSelect
  const handleTrackSelect = async (trackUri, deviceId, playlistUris, track) => {
    console.log("Playing track URI:", trackUri);
    console.log("Using device ID:", deviceId);
    console.log("Playlist URIs count:", playlistUris?.length); // FIXED: Now this won't be undefined
    await window.__webPlaybackActivateElement?.();
    const activeDeviceId = deviceId || window.__webPlaybackDeviceId;

    if (!token) {
      console.error("No token available");
      alert("Please login again");
      return;
    }

    if (!activeDeviceId) {
      if (roomCode) {
        sendCommand({
          type: 'playTrack',
          trackUri,
          playlistUris: playlistUris || [],
          track,
          positionMs: 0,
        });
        return;
      }

      console.error("No device ID available");
      alert("Spotify browser player is still connecting. Wait a few seconds, then click the song again.");
      return;
    }

    try {
      let body;
      if (playlistUris && playlistUris.length > 0) {
        body = {
          uris: playlistUris,
          offset: {
            uri: trackUri
          }
        };
        console.log("Playing playlist with all", playlistUris.length, "tracks");
      } else {
        body = {
          uris: [trackUri]
        };
        console.log("Playing single track (no playlist context)");
      }

      const getSpotifyErrorMessage = async (response) => {
        try {
          const error = await response.json();
          return error.error?.message || JSON.stringify(error);
        } catch {
          return response.statusText || 'Unknown Spotify error';
        }
      };

      const transferPlaybackToDevice = async () => {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          body: JSON.stringify({
            device_ids: [activeDeviceId],
            play: false,
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok && response.status !== 204) {
          const details = await getSpotifyErrorMessage(response);
          console.warn(`Playback transfer failed (${response.status}): ${details}`);
        }

        return response;
      };

      const playOnDevice = () => (
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(activeDeviceId)}`, {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        })
      );

      let response = null;
      let lastErrorMessage = '';

      for (let attempt = 0; attempt < 8; attempt += 1) {
        await transferPlaybackToDevice();
        await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 400 : 900));

        response = await playOnDevice();

        if (response.ok || response.status === 204) {
          break;
        }

        lastErrorMessage = await getSpotifyErrorMessage(response);

        if (response.status !== 404) {
          break;
        }
      }

      if (response?.ok || response?.status === 204) {
        console.log("Playback started successfully");
        setIsPlaying(true);
        const command = {
          type: 'playTrack',
          trackUri,
          playlistUris: playlistUris || [],
          track,
          positionMs: 0,
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        };

        setLocalTrackCommand(command);
        sendCommand(command);
      } else {
        console.error("Failed to start playback:", response?.status, lastErrorMessage);
        if (response?.status === 403) {
          alert("Spotify Premium is required for playback");
        } else if (response?.status === 404) {
          setCurrentDeviceId(null);
          alert("Spotify created the browser player, but Spotify Connect still rejects it as a playback device. Turn off Brave Shields/ad blockers for 127.0.0.1, close mobile device emulation, refresh, then try again.");
        } else {
          alert(`Failed to play track: ${lastErrorMessage || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error playing track:", error);
      alert(error.message || "Failed to play track");
    }
  };

  // Demo mode track select handler
  const handleDemoTrackSelect = (trackUri, _deviceId, playlistUris, track) => {
    console.log("Demo: Playing track URI:", trackUri);

    const command = {
      type: 'playTrack',
      trackUri,
      playlistUris: playlistUris || [],
      track,
      positionMs: 0,
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    };

    setLocalTrackCommand(command);
    sendCommand(command);
  };

  const playlistSignatureRef = useRef('');

  // Add this function to receive playlist URIs from MusicCard
  const handlePlaylistLoaded = useCallback((uris, tracks = []) => {
    const nextSignature = uris.join('|');
    if (nextSignature === playlistSignatureRef.current) return;

    playlistSignatureRef.current = nextSignature;
    console.log("Playlist URIs received:", uris.length);
    setPlaylistUris(uris);
    setPlaylistTracks(tracks);

    if (roomCode && tracks.length > 0) {
      sendPlaylist(tracks);
    }
  }, [roomCode, sendPlaylist, setPlaylistTracks, setPlaylistUris]);

  useEffect(() => {
    if (roomCode && playlistTracks.length > 0) {
      sendPlaylist(playlistTracks);
    }
  }, [playlistTracks, roomCode, sendPlaylist]);

  const handleCreateRoom = async () => {
    try {
      const code = await createRoom();
      setJoinCode(code);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    try {
      await joinRoom(joinCode);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  return (
    <Screencontainer>
      <div className="fixed inset-x-3 top-20 z-50 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-amber-200/20 bg-slate-950/90 px-3 py-3 shadow-xl backdrop-blur md:inset-x-auto md:right-6 md:top-5 md:justify-start md:gap-3 md:px-4">
        {roomCode ? (
          <>
            <div className="text-sm">
              <p className="text-slate-400">Room</p>
              <p className="font-mono text-amber-200">{roomCode}</p>
            </div>
            <div className="h-9 w-px bg-slate-700" />
            <div className="text-sm">
              <p className="text-slate-400">Users</p>
              <p className="text-white">{userCount}</p>
            </div>
            <div className={`h-2 w-2 rounded-full ${roomConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {isDemoMode && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                DEMO
              </span>
            )}
            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              Leave
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="rounded-md bg-amber-200 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100"
            >
              Create room
            </button>
            <form onSubmit={handleJoinRoom} className="flex min-w-0 items-center gap-2">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Room code"
                className="w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-white outline-none focus:border-amber-200 sm:w-28"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Join room
              </button>
            </form>
            {roomError && <p className="text-xs text-red-300">{roomError}</p>}
          </>
        )}
      </div>

      {/* Render DemoMusicCard for demo mode, regular MusicCard for Spotify users */}
      {isDemoMode ? (
        <DemoMusicCard
          onTrackSelect={handleDemoTrackSelect}
          onPlaylistLoaded={handlePlaylistLoaded}
          sharedTracks={sharedPlaylist}
          canControlRoom={!!roomCode}
        />
      ) : (
        <MusicCard
          playlistId={selectedPlaylistId}
          token={token}
          currentDeviceId={currentDeviceId}
          onTrackSelect={handleTrackSelect}
          onPlaylistLoaded={handlePlaylistLoaded}
          sharedTracks={sharedPlaylist}
          canControlRoom={!!roomCode}
        />
      )}
    </Screencontainer>
  )
}
