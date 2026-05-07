// SpotifyMusicCard.jsx
import { useState, useEffect } from 'react';

const SpotifyMusicCard = ({ accessToken }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user's saved tracks from Spotify API
  useEffect(() => {
    const fetchSavedTracks = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=10', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch tracks');
        
        const data = await response.json();
        // Transform API response to our component's format
        const formattedTracks = data.items.map((item, index) => ({
          id: item.track.id,
          number: index + 1,
          title: item.track.name,
          artist: item.track.artists.map(a => a.name).join(', '),
          durationMs: item.track.duration_ms,
          albumArt: item.track.album.images[0]?.url,
          previewUrl: item.track.preview_url,
          uri: item.track.uri
        }));
        
        setTracks(formattedTracks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedTracks();
  }, [accessToken]);

  // Format milliseconds to MM:SS
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 w-96 shadow-2xl">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 rounded-2xl p-5 w-96">
        <p className="text-red-200 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 w-96 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-amber-200/20">
        <div>
          <h2 className="text-white font-bold text-lg">Your Library</h2>
          <p className="text-gray-400 text-xs mt-1">Saved Tracks</p>
        </div>
        <span className="text-amber-200 text-sm">{tracks.length} tracks</span>
      </div>

      {/* Track List */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {tracks.map((track) => (
          <div
            key={track.id}
            onClick={() => setActiveTrack(track.id)}
            className={`
              flex items-center gap-3 p-2 rounded-xl cursor-pointer
              transition-all duration-200 group
              ${activeTrack === track.id 
                ? 'bg-amber-200/20 border border-amber-200/30' 
                : 'bg-white/5 hover:bg-white/10'
              }
              hover:translate-x-1
            `}
          >
            {/* Album Art (optional) */}
            {track.albumArt && (
              <img 
                src={track.albumArt} 
                alt={track.title}
                className="w-10 h-10 rounded-md object-cover"
              />
            )}
            
            {/* Track Number (fallback if no image) */}
            {!track.albumArt && (
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-md
                font-semibold text-sm
                ${activeTrack === track.id 
                  ? 'bg-amber-200 text-slate-900' 
                  : 'bg-white/10 text-amber-200'
                }
              `}>
                {track.number}
              </div>
            )}

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm truncate">
                {track.title}
              </div>
              <div className="text-gray-400 text-xs truncate">
                {track.artist}
              </div>
            </div>

            {/* Duration */}
            <div className="text-amber-200 font-mono text-xs">
              {formatDuration(track.durationMs)}
            </div>
          </div>
        ))}
      </div>

      {/* Now Playing Indicator */}
      {activeTrack && (
        <div className="mt-4 pt-3 border-t border-amber-200/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-200 rounded-full animate-pulse" />
            <span className="text-amber-200 text-xs">
              Playing: {tracks.find(t => t.id === activeTrack)?.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyMusicCard;