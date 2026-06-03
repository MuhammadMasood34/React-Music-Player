// // MusicCard.jsx
// import { useState, useEffect, useRef } from 'react';
// import apiClient from '../../spotify';

// const MusicCard = ({ playlistId }) => {
//   const [activeTrack, setActiveTrack] = useState(null);
//   const [tracksData, setTracksData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const audioRef = useRef(null);

//   const handleAPiData = async (playlistId) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get(`playlists/${playlistId}`);

//       console.log("Full API Response:", response);
//       console.log("Response data structure:", response.data);
//       console.log("Items:", response.data.items);
//       console.log("Items.items:", response.data.items?.items);

//       // Check the correct data path
//       let tracks = [];
//       if (response.data.items && response.data.items.items) {
//         tracks = response.data.items.items;
//       } else if (response.data.items && Array.isArray(response.data.items)) {
//         tracks = response.data.items;
//       } else if (response.data.tracks && response.data.tracks.items) {
//         tracks = response.data.tracks.items;
//       }

//       console.log("Extracted tracks:", tracks);

//       // Log preview URLs to verify
//       tracks.forEach((item, idx) => {
//         console.log(`Track ${idx + 1}:`, {
//           name: item.item?.name || item.track?.name,
//           preview_url: item.item?.preview_url || item.track?.preview_url,
//           hasPreview: !!(item.item?.preview_url || item.track?.preview_url)
//         });
//       });

//       setTracksData(tracks);
//       setError(null);
//     } catch (err) {
//       console.error("ERROR:", err);
//       setError("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (playlistId) {
//       handleAPiData(playlistId);
//     } else {
//       handleAPiData("6nqDE6AngPtfuY2JmOILXw");
//     }
//   }, [playlistId]);

//   // Cleanup audio on component unmount
//   useEffect(() => {
//     return () => {
//       if (audioRef.current) {
//         audioRef.current.pause();
//         audioRef.current = null;
//       }
//     };
//   }, []);

//   const handlePlayTrack = (track) => {
//     // Try different paths to get preview_url
//     const previewUrl = track.item?.preview_url || track.track?.preview_url || track.preview_url;
//     const trackName = track.item?.name || track.track?.name || track.name;
//     const trackArtist = track.item?.artists?.[0]?.name || track.track?.artists?.[0]?.name;

//     console.log("Attempting to play track:", trackName);
//     console.log("Full track object:", track);
//     console.log("Preview URL found:", previewUrl);
//     console.log("Preview URL type:", typeof previewUrl);

//     // Check if preview_url exists and is a valid MP3 URL
//     if (!previewUrl || previewUrl === null) {
//       console.warn("No preview URL available for:", trackName);
//       alert(`No 30-second preview available for "${trackName}".\n\nNote: Only some Spotify tracks have preview URLs.`);
//       return;
//     }

//     // Check if it's a Spotify track link instead of preview URL
//     if (previewUrl.includes('open.spotify.com') || previewUrl.includes('spotify:track:')) {
//       console.error("This is a Spotify track link, not a preview URL:", previewUrl);
//       alert(`Cannot play "${trackName}" - This is a Spotify track link, not a playable audio file.\n\nTo play full tracks, you would need Spotify Premium and the Web Playback SDK.`);
//       return;
//     }

//     // Check if URL is a valid audio file
//     if (!previewUrl.startsWith('https://') || !previewUrl.includes('.mp3')) {
//       console.error("Invalid audio URL format:", previewUrl);
//       alert("Invalid audio URL format - not an MP3 file");
//       return;
//     }

//     // Stop current playing audio
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current = null;
//       setIsPlaying(false);
//     }

//     // Create new audio instance
//     const audio = new Audio();

//     // Set up error handling
//     audio.addEventListener('error', (e) => {
//       console.error("Audio error event:", e);
//       console.error("Audio error code:", audio.error?.code);
//       console.error("Audio error message:", audio.error?.message);

//       let errorMessage = "Failed to play track. ";
//       if (!previewUrl) {
//         errorMessage = "No preview URL available for this track.";
//       } else if (audio.error?.code === 4) {
//         errorMessage = "The audio format is not supported by your browser.";
//       } else {
//         errorMessage += `Error code: ${audio.error?.code}`;
//       }
//       alert(errorMessage);
//       setIsPlaying(false);
//       setActiveTrack(null);
//       audioRef.current = null;
//     });

//     // Set the source
//     audio.src = previewUrl;
//     audioRef.current = audio;

//     // Try to play
//     const playPromise = audio.play();

//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           setIsPlaying(true);
//           setActiveTrack(track.item?.id || track.track?.id || track.id);
//           console.log("Successfully playing:", trackName);
//         })
//         .catch(error => {
//           console.error("Play promise rejected:", error);
//           alert(`Cannot play "${trackName}": ${error.message}`);
//           setIsPlaying(false);
//           setActiveTrack(null);
//           audioRef.current = null;
//         });
//     }

//     // Handle audio end
//     audio.addEventListener('ended', () => {
//       console.log("Audio ended");
//       setIsPlaying(false);
//       setActiveTrack(null);
//       audioRef.current = null;
//     });
//   };

//   const stopPlayback = () => {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current = null;
//       setIsPlaying(false);
//       setActiveTrack(null);
//     }
//   };

//   if (loading) {
//     return <div className="text-white">Loading...</div>;
//   }

//   if (error) {
//     return <div className="text-red-500">{error}</div>;
//   }

//   return (
//     <div className="bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4 h-screen">
//       <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 w-[calc(100%-100px)] h-screen shadow-2xl border border-amber-200/10 overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-5 pb-3 border-b border-amber-200/20 flex-shrink-0">
//           <h2 className="text-white font-bold text-lg">Playlist</h2>
//           <span className="text-amber-200 text-sm">{tracksData.length} tracks</span>
//         </div>

//         {/* Track List */}
//         <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
//           {tracksData.map((item, index) => {
//             // Try different paths to get track data
//             const track = item.item || item.track || item;
//             const hasPreview = !!(track.preview_url && track.preview_url.includes('.mp3'));

//             return (  
//               <div 
//                 key={track.id || index} 
//                 onClick={() => hasPreview && handlePlayTrack(item)}
//                 className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
//                   hasPreview ? 'cursor-pointer' : 'cursor-not-allowed'
//                 } ${
//                   activeTrack === track.id && isPlaying
//                     ? 'bg-amber-200/20 border border-amber-200/30' 
//                     : hasPreview ? 'hover:bg-white/5' : ''
//                 } ${!hasPreview ? 'opacity-50' : ''}`}
//               >
//                 <div className="text-slate-400 font-mono text-sm w-6 flex-shrink-0">
//                   {index + 1}
//                 </div>

//                 <div className="flex items-center gap-3 flex-1 min-w-0"> 
//                   <img 
//                     src={track?.album?.images?.[2]?.url || track?.album?.images?.[0]?.url} 
//                     alt="image of song" 
//                     className="w-10 h-10 rounded-md object-cover shadow-md flex-shrink-0"
//                     onError={(e) => {
//                       e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
//                     }}
//                   />
//                   <div className="flex-1 min-w-0">
//                     <div className="text-white font-medium truncate">
//                       {track.name}
//                       {!hasPreview && (
//                         <span className="ml-2 text-red-400 text-xs">(No preview)</span>
//                       )}
//                       {activeTrack === track.id && isPlaying && (
//                         <span className="ml-2 text-amber-200 text-xs animate-pulse">▶ Playing</span>
//                       )}
//                     </div>
//                     <div className="text-slate-400 text-sm truncate">
//                       {track.artists?.[0]?.name || 'Unknown Artist'}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="text-slate-400 text-sm font-mono whitespace-nowrap flex-shrink-0">
//                   {Math.floor((track.duration_ms || 0) / 60000)}:
//                   {String(Math.floor(((track.duration_ms || 0) % 60000) / 1000)).padStart(2, "0")}
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Now Playing Bar */}
//         {activeTrack && isPlaying && (
//           <div className="mt-4 pt-3 border-t border-amber-200/20 flex-shrink-0">
//             <div className="flex items-center justify-between gap-3">
//               <div className="flex items-center gap-3 flex-1">
//                 <div className="w-2 h-2 bg-amber-200 rounded-full animate-pulse flex-shrink-0" />
//                 <span className="text-amber-200 text-xs truncate">
//                   Now playing: {tracksData.find(t => (t.item?.id || t.track?.id) === activeTrack)?.item?.name || tracksData.find(t => (t.item?.id || t.track?.id) === activeTrack)?.track?.name}
//                 </span>
//               </div>
//               <button 
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   stopPlayback();
//                 }}
//                 className="text-amber-200 text-xs hover:text-amber-300 transition-colors px-2 py-1 rounded bg-amber-200/10"
//               >
//                 Stop
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Debug info */}
//         <div className="mt-2 text-xs text-slate-500">
//           <details>
//             <summary>Debug Info - Click to expand</summary>
//             <p>Tracks with previews: {tracksData.filter(t => {
//               const track = t.item || t.track || t;
//               return track.preview_url && track.preview_url.includes('.mp3');
//             }).length} / {tracksData.length}</p>
//             <div className="mt-1 max-h-32 overflow-y-auto">
//               {tracksData.slice(0, 5).map((t, i) => {
//                 const track = t.item || t.track || t;
//                 return (
//                   <div key={i} className="text-[10px]">
//                     {i+1}. {track.name}: {track.preview_url ? 'Has Preview' : 'No Preview'}
//                     {track.preview_url && !track.preview_url.includes('.mp3') && ' (Invalid format)'}
//                   </div>
//                 );
//               })}
//             </div>
//           </details>
//         </div>
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(255, 255, 255, 0.05);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(251, 191, 36, 0.3);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: rgba(251, 191, 36, 0.5);
//         }
//       `}</style>
//     </div>
//   );
// };

//export default MusicCard;



// MusicCard.jsx (17/4/2026)
// MusicCard.jsx
import { useState, useEffect, useRef } from 'react';
import apiClient from '../../spotify';

const normalizeTrack = (item) => {
  const track = item.item || item.track || item;

  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    durationMs: track.duration_ms || track.durationMs,
    artistName: track.artists?.[0]?.name || track.artistName || 'Unknown Artist',
    albumImageUrl: track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || track.albumImageUrl,
  };
};

// ADDED: New props for Solution 1
const MusicCard = ({ playlistId, token, onTrackSelect, currentDeviceId, onPlaylistLoaded, sharedTracks = [], canControlRoom = false }) => {
  const [activeTrack, setActiveTrack] = useState(null);
  const [tracksData, setTracksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleAPiData = async (playlistId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`playlists/${playlistId}`);

      // console.log("Full API Response:", response);
      // console.log("Response data structure:", response.data);
      // console.log("Items:", response.data.items);
      // console.log("Items.items:", response.data.items?.items);

      // Check the correct data path
      let tracks = [];
      if (response.data.items && response.data.items.items) {
        tracks = response.data.items.items;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        tracks = response.data.items;
      } else if (response.data.tracks && response.data.tracks.items) {
        tracks = response.data.tracks.items;
      }

      // console.log("Extracted tracks:", tracks);

      // Log preview URLs to verify
      // tracks.forEach((item, idx) => {
      //   console.log(`Track ${idx + 1}:`, {
      //     name: item.item?.name || item.track?.name,
      //     preview_url: item.item?.preview_url || item.track?.preview_url,
      //     hasPreview: !!(item.item?.preview_url || item.track?.preview_url)
      //   });
      // });

      setTracksData(tracks);
      setError(null);
    } catch (err) {
      console.error("ERROR:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId) {
      handleAPiData(playlistId);
    } else {
      handleAPiData("6nqDE6AngPtfuY2JmOILXw");
    }
  }, [playlistId]);

  useEffect(() => {
    const uris = tracksData.map(item => {
      const track = item.item || item.track || item;
      return track.uri;
    }).filter(Boolean);

    if (uris.length > 0) {
      onPlaylistLoaded?.(uris, tracksData.map(normalizeTrack));
    }
  }, [onPlaylistLoaded, tracksData]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // MODIFIED: Updated handlePlayTrack to work with both preview URLs and Spotify Web Playback
  const handlePlayTrack = (track) => {
    const trackUri = track.item?.uri || track.track?.uri || track.uri;
    const trackName = track.item?.name || track.track?.name || track.name;
    const previewUrl = track.item?.preview_url || track.track?.preview_url;

    // console.log("=== PLAY TRACK CLICKED ===");
    // console.log("Track Name:", trackName);
    // console.log("Track URI:", trackUri);
    // console.log("Token available?", !!token);
    // console.log("Device ID available?", !!currentDeviceId);
    // console.log("onTrackSelect available?", !!onTrackSelect);

    // PRIORITY 1: Use Spotify Web Playback for full tracks. The click handler can
    // wait for the browser device if the SDK is still finishing its connection.
    if (trackUri && onTrackSelect && token) {
      console.log("🎵 USING SPOTIFY WEB PLAYBACK for:", trackName);

      // Extract all playlist URIs
      const allPlaylistUris = tracksToDisplay.map(item => {
        const t = item.item || item.track || item;
        return t.uri;
      }).filter(uri => uri);


      onTrackSelect(trackUri, currentDeviceId, allPlaylistUris, normalizeTrack(track));
      setActiveTrack(track.item?.id || track.track?.id || track.id);
      return;
    }

    // PRIORITY 2: Fallback to preview URL (shows your alert)
    if (previewUrl && previewUrl.includes('.mp3')) {
      // Play preview URL logic here
      console.log("⚠️ Using preview URL fallback for:", trackName);
      // ... existing preview playback code
      return;
    }
    console.error(`Cannot play "${trackName}": No Spotify Web Playback available and no preview URL`);{
      alert(`Cannot play "${trackName}".\n\nMake sure you have:\n1. Spotify Premium account\n2. Spotify app open on your device\n3. WebPlayback SDK properly connected`);
    };
    return;
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setActiveTrack(null);
    }
  };

  const tracksToDisplay = sharedTracks.length > 0 ? sharedTracks : tracksData;

  if (loading && tracksToDisplay.length === 0) {
    return <div className="text-white">Loading...</div>;
  }

  if (error && tracksToDisplay.length === 0) {
    return <div className="text-red-500">{error}</div>;
  }// In your MusicCard component, right before the return statement
  // console.log("===== SPOTIFY PLAYBACK DEBUG =====");
  // console.log("Token available?", !!token);
  // console.log("Current Device ID:", currentDeviceId);
  // console.log("Tracks count:", tracksData.length);

  // Add this right before the return statement in MusicCard
  // console.log("===== BEFORE RETURN - CHECKING PLAYBACK CONDITIONS =====");
  // console.log("Token exists?", !!token);
  // console.log("CurrentDeviceId exists?", !!currentDeviceId);
  // console.log("Token value:", token);
  // console.log("DeviceId value:", currentDeviceId);
  // console.log("onTrackSelect exists?", !!onTrackSelect);

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-2 pb-44 pt-28 sm:p-4 sm:pb-40 md:pt-4">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-amber-200/10 bg-gradient-to-br from-slate-900 to-slate-800 p-3 shadow-2xl sm:p-5 md:rounded-2xl">
        {/* Header */}
        <div className="mb-3 flex flex-shrink-0 items-center justify-between border-b border-amber-200/20 pb-3 sm:mb-5">
          <h2 className="text-white font-bold text-lg">Playlist</h2>
          <span className="text-amber-200 text-sm">{tracksToDisplay.length} tracks</span>
        </div>

        {/* Track List */}
        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1 sm:pr-2">
          {tracksToDisplay.map((item, index) => {
            // Try different paths to get track data
            const track = item.item || item.track || item;
            const hasPreview = !!(track.preview_url && track.preview_url.includes('.mp3'));
            // ADDED: Check if Spotify playback is available
            const hasSpotifyPlayback = !!(token && track.uri && currentDeviceId);
            const isPlayable = true;

            return (
              <div
                key={track.id || index}
                onClick={() => isPlayable && handlePlayTrack(item)}
                className={`group flex items-center gap-2 rounded-lg p-2 transition-all duration-200 sm:gap-3 sm:p-3 sm:rounded-xl ${isPlayable ? 'cursor-pointer' : 'cursor-not-allowed'
                  } ${activeTrack === track.id && isPlaying
                    ? 'bg-amber-200/20 border border-amber-200/30'
                    : isPlayable ? 'hover:bg-white/5' : ''
                  } ${!isPlayable ? 'opacity-50' : ''}`}
              >
                <div className="text-slate-400 font-mono text-sm w-6 flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={track?.album?.images?.[2]?.url || track?.album?.images?.[0]?.url || track?.albumImageUrl}
                    alt="image of song"
                    className="h-10 w-10 flex-shrink-0 rounded-md object-cover shadow-md sm:h-11 sm:w-11"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-white sm:text-base">
                      {track.name}
                      {!isPlayable && (
                        <span className="ml-2 text-red-400 text-xs">(No preview)</span>
                      )}
                      {/* ADDED: Show badge for Spotify playback */}
                      {hasSpotifyPlayback && !hasPreview && (
                        <span className="ml-2 text-green-400 text-xs">(Full track via Spotify)</span>
                      )}
                      {canControlRoom && !currentDeviceId && (
                        <span className="ml-2 text-amber-200 text-xs">(Room remote)</span>
                      )}
                      {activeTrack === track.id && isPlaying && (
                        <span className="ml-2 text-amber-200 text-xs animate-pulse">▶ Playing</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-slate-400 sm:text-sm">
                      {track.artists?.[0]?.name || track.artistName || 'Unknown Artist'}
                    </div>
                  </div>
                </div>

                <div className="hidden flex-shrink-0 whitespace-nowrap font-mono text-sm text-slate-400 sm:block">
                  {Math.floor((track.duration_ms || track.durationMs || 0) / 60000)}:
                  {String(Math.floor(((track.duration_ms || track.durationMs || 0) % 60000) / 1000)).padStart(2, "0")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Now Playing Bar */}
        {activeTrack && isPlaying && (
          <div className="mt-4 pt-3 border-t border-amber-200/20 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-2 h-2 bg-amber-200 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-amber-200 text-xs truncate">
                  Now playing: {tracksData.find(t => (t.item?.id || t.track?.id) === activeTrack)?.item?.name || tracksData.find(t => (t.item?.id || t.track?.id) === activeTrack)?.track?.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopPlayback();
                }}
                className="text-amber-200 text-xs hover:text-amber-300 transition-colors px-2 py-1 rounded bg-amber-200/10"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Debug info */}
        {/* Debug info */}
        <div className="mt-2 text-xs text-slate-500">
          <details>
            <summary>Debug Info - Click to expand</summary>
            <p>Tracks with previews: {tracksData.filter(t => {
              const track = t.item || t.track || t;
              return track.preview_url && track.preview_url.includes('.mp3');
            }).length} / {tracksData.length}</p>

            {/* ADDED: Show Spotify playback status */}
            <p>Spotify Web Playback: {token ? (currentDeviceId ? '✅ Connected' : '⏳ Waiting for device...') : '❌ No token'}</p>

            <div className="mt-1 max-h-32 overflow-y-auto">
              {tracksData.slice(0, 10).map((t, i) => {
                const track = t.item || t.track || t;

                // CONSOLE LOG for each track to see preview_url status
                // console.log(`Track ${i + 1} - "${track.name}":`, {
                //   name: track.name,
                //   hasPreviewUrl: !!track.preview_url,
                //   previewUrl: track.preview_url,
                //   urlType: track.preview_url ? (track.preview_url.includes('.mp3') ? 'MP3' : 'Other') : 'None',
                //   hasUri: !!track.uri,
                //   uri: track.uri
                // });

                return (
                  <div key={i} className="text-[10px]">
                    {i + 1}. {track.name}:
                    {track.preview_url ? (
                      <span className="text-green-400"> ✓ Has Preview</span>
                    ) : (
                      <span className="text-red-400"> ✗ No Preview</span>
                    )}
                    {track.preview_url && !track.preview_url.includes('.mp3') && (
                      <span className="text-yellow-400"> (Invalid format)</span>
                    )}
                    {/* Show if has Spotify URI */}
                    {track.uri && (
                      <span className="text-blue-400"> | Has URI: ✓</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ADDED: Summary of why previews might be missing */}
            <div className="mt-2 p-2 bg-slate-800 rounded text-[10px]">
              <p className="font-bold mb-1">Why no preview URLs?</p>
              <p>1. Not all Spotify tracks have preview URLs (only ~30-40% do)</p>
              <p>2. Preview URLs are only available for certain tracks/regions</p>
              <p>3. The API might not return preview_url for this playlist</p>
              <p className="mt-1 font-bold">Solution: Use Spotify Web Playback SDK for full tracks</p>
            </div>
          </details>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </div>
  );
};

export default MusicCard;
