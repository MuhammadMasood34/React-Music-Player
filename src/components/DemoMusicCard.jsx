import { useState, useEffect, useCallback } from 'react';
import { DEMO_TRACKS, DEMO_PLAYLIST_URIS } from '../data/demoPlaylist';

/**
 * DemoMusicCard — Shows demo tracks for non-premium Spotify users.
 * Mirrors MusicCard's interface so it integrates with the Players screen.
 */
const DemoMusicCard = ({ onTrackSelect, onPlaylistLoaded, sharedTracks = [], canControlRoom = false }) => {
  const [activeTrack, setActiveTrack] = useState(null);

  // Use shared tracks from room if available, otherwise use demo tracks
  const tracksToDisplay = sharedTracks.length > 0 ? sharedTracks : DEMO_TRACKS;

  // Notify parent about loaded playlist on mount
  useEffect(() => {
    if (onPlaylistLoaded) {
      onPlaylistLoaded(DEMO_PLAYLIST_URIS, DEMO_TRACKS);
    }
  }, [onPlaylistLoaded]);

  const handlePlayTrack = (track) => {
    const trackUri = track.uri;
    const allPlaylistUris = tracksToDisplay.map((t) => t.uri).filter(Boolean);

    setActiveTrack(track.id);

    if (onTrackSelect) {
      onTrackSelect(trackUri, null, allPlaylistUris, track);
    }
  };

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-2 pb-44 pt-28 sm:p-4 sm:pb-40 md:pt-4">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-emerald-400/10 bg-gradient-to-br from-slate-900 to-slate-800 p-3 shadow-2xl sm:p-5 md:rounded-2xl">
        {/* Header */}
        <div className="mb-3 flex flex-shrink-0 items-center justify-between border-b border-emerald-400/20 pb-3 sm:mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg">Demo Playlist</h2>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              FREE
            </span>
          </div>
          <span className="text-emerald-300 text-sm">{tracksToDisplay.length} tracks</span>
        </div>

        {/* Info banner */}
        <div className="mb-3 flex-shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-emerald-200 text-xs">
            🎵 These are free demo songs for testing. Create or join a room to sync playback with other users!
          </p>
        </div>

        {/* Track List */}
        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1 sm:pr-2">
          {tracksToDisplay.map((track, index) => {
            const isActive = activeTrack === track.id;

            return (
              <div
                key={track.id || index}
                onClick={() => handlePlayTrack(track)}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all duration-200 sm:gap-3 sm:p-3 sm:rounded-xl ${
                  isActive
                    ? 'bg-emerald-400/20 border border-emerald-400/30'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="text-slate-400 font-mono text-sm w-6 flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={track.albumImageUrl}
                    alt={track.name}
                    className="h-10 w-10 flex-shrink-0 rounded-md object-cover shadow-md sm:h-11 sm:w-11"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40x40?text=🎵';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-white sm:text-base">
                      {track.name}
                      {isActive && (
                        <span className="ml-2 text-emerald-300 text-xs animate-pulse">▶ Playing</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-slate-400 sm:text-sm">
                      {track.artistName || 'Unknown Artist'}
                    </div>
                  </div>
                </div>

                <div className="hidden flex-shrink-0 whitespace-nowrap font-mono text-sm text-slate-400 sm:block">
                  {Math.floor((track.durationMs || 0) / 60000)}:
                  {String(Math.floor(((track.durationMs || 0) % 60000) / 1000)).padStart(2, "0")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-3 flex-shrink-0 border-t border-slate-700/50 pt-3">
          <p className="text-slate-500 text-xs text-center">
            Want full Spotify tracks? Log in with a Spotify Premium account.
          </p>
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
          background: rgba(52, 211, 153, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 211, 153, 0.5);
        }
      `}</style>
    </div>
  );
};

export default DemoMusicCard;
