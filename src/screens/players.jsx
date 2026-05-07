// import React, { useState, useEffect } from 'react'
// import Screencontainer from '../shared/screencontainer'
// import MusicCard from '../components/MusicCard'
// import { useLocation } from 'react-router-dom'
// import WebPlayback from '../components/WebPlayback'

// export default function Players() {
//   const location = useLocation();
//   const selectedPlaylistId = location.state?.playlistId || "6nqDE6AngPtfuY2JmOILXw";

//   const [token, setToken] = useState(null);
//   const [currentDeviceId, setCurrentDeviceId] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     console.log("Token in Players:", storedToken ? "Present" : "Missing");
//     if (storedToken) {
//       setToken(storedToken);
//     }
//   }, []);

//   const handleWebPlaybackReady = (deviceId) => {
//     console.log("✅ WebPlayback READY callback received! Device ID:", deviceId);
//     setCurrentDeviceId(deviceId);
//   };

//   const handlePlayerStateChange = (state) => {
//     // console.log("Player state changed:", state);
//     if (state) {
//       setIsPlaying(!state.paused);
//     }
//   };

//   const handleTrackSelect = async (trackUri, deviceId) => {
//     console.log("Playing track URI:", trackUri);
//     console.log("Using device ID:", deviceId);

//     if (!token) {
//       console.error("No token available");
//       alert("Please login again");
//       return;
//     }

//     if (!deviceId) {
//       console.error("No device ID available");
//       alert("Player is not ready. Please wait a moment.");
//       return;
//     }

//     try {
//       const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
//         method: 'PUT',
//         body: JSON.stringify({ uris: [trackUri] }),
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//       });

//       if (response.ok) {
//         console.log("Playback started successfully");
//         setIsPlaying(true);
//       } else {
//         const error = await response.json();
//         console.error("Failed to start playback:", error);
//         if (response.status === 403) {
//           alert("Spotify Premium is required for playback");
//         } else {
//           alert(`Failed to play track: ${error.error?.message || 'Unknown error'}`);
//         }
//       }
//     } catch (error) {
//       console.error("Error playing track:", error);
//       alert("Failed to play track");
//     }
//   };

//   return (
//     <Screencontainer>
//       {token && (
//         <WebPlayback 
//           token={token}
//           onReady={handleWebPlaybackReady}
//           onPlayerStateChange={handlePlayerStateChange}
//         />
//       )}

//       <MusicCard
//         playlistId={selectedPlaylistId}
//         token={token}
//         currentDeviceId={currentDeviceId}
//         onTrackSelect={handleTrackSelect}
//       />
//     </Screencontainer>
//   )
// }


import React, { useState, useEffect } from 'react'
import Screencontainer from '../shared/screencontainer'
import MusicCard from '../components/MusicCard'
import { useLocation } from 'react-router-dom'
import WebPlayback from '../components/WebPlayback'

export default function Players() {
  const location = useLocation();
  const selectedPlaylistId = location.state?.playlistId || "6nqDE6AngPtfuY2JmOILXw";

  const [token, setToken] = useState(null);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Add webPlaybackKey state
  const [webPlaybackKey, setWebPlaybackKey] = useState(Date.now());

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log("Token in Players:", storedToken ? "Present" : "Missing");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // When token changes, remount WebPlayback
  useEffect(() => {
    if (token) {
      console.log("Token changed, remounting WebPlayback");
      setWebPlaybackKey(Date.now());
    }
  }, [token]);

  const handleWebPlaybackReady = (deviceId) => {
    console.log("✅ WebPlayback READY callback received! Device ID:", deviceId);
    setCurrentDeviceId(deviceId);
  };

  const handlePlayerStateChange = (state) => {
    // console.log("Player state changed:", state);
    if (state) {
      setIsPlaying(!state.paused);
    }
  };

  // In Players.jsx, modify handleTrackSelect
  // In Players.jsx - Update handleTrackSelect
  const handleTrackSelect = async (trackUri, deviceId, playlistUris) => {
    console.log("Playing track URI:", trackUri);
    console.log("Using device ID:", deviceId);
    console.log("Playlist URIs count:", playlistUris?.length); // FIXED: Now this won't be undefined

    if (!token) {
      console.error("No token available");
      alert("Please login again");
      return;
    }

    if (!deviceId) {
      console.error("No device ID available");
      alert("Player is not ready. Please wait a moment.");
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

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        console.log("Playback started successfully");
        setIsPlaying(true);
      } else {
        const error = await response.json();
        console.error("Failed to start playback:", error);
        if (response.status === 403) {
          alert("Spotify Premium is required for playback");
        } else if (response.status === 404) {
          alert("No active device found. Please open Spotify app.");
        } else {
          alert(`Failed to play track: ${error.error?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error playing track:", error);
      alert("Failed to play track");
    }
  };

  const [playlistUris, setPlaylistUris] = useState([]);

  // Add this function to receive playlist URIs from MusicCard
  const handlePlaylistLoaded = (uris) => {
    console.log("Playlist URIs received:", uris.length);
    setPlaylistUris(uris);
  };

  return (
    <Screencontainer>
      {token && (
        <WebPlayback
          key={webPlaybackKey}
          token={token}
          onReady={handleWebPlaybackReady}
          onPlayerStateChange={handlePlayerStateChange}
          playlistUris={playlistUris}
        />
      )}

      <MusicCard
        playlistId={selectedPlaylistId}
        token={token}
        currentDeviceId={currentDeviceId}
        onTrackSelect={handleTrackSelect}
        // onPlaylistLoaded={handlePlaylistLoaded}
      />
    </Screencontainer>
  )
}