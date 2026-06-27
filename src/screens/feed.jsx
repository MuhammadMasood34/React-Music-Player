import React, { useState, useEffect } from 'react'
import Screencontainer from '../shared/screencontainer'
import apiClient from '../../spotify';

const DEMO_ACTIVITY = [
  { id: 1, type: 'playlist', user: 'Alex', action: 'created a playlist', title: 'Workout Mix 2024', time: '2h ago', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop' },
  { id: 2, type: 'liked', user: 'Sarah', action: 'liked a song', title: 'Flowers - Miley Cyrus', time: '3h ago', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop' },
  { id: 3, type: 'room', user: 'Mike', action: 'started a listening room', title: 'Chill Vibes Room', time: '4h ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop' },
  { id: 4, type: 'follow', user: 'Emma', action: 'followed you', title: '', time: '5h ago', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop' },
  { id: 5, type: 'playlist', user: 'Jordan', action: 'shared a playlist', title: 'Late Night Jazz', time: '6h ago', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop' },
  { id: 6, type: 'liked', user: 'Chris', action: 'liked a song', title: 'Blinding Lights - The Weeknd', time: '8h ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop' },
];

const DEMO_PLAYLISTS = [
  { id: 1, name: 'Discover Weekly', desc: 'Made for you', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop', tracks: 30 },
  { id: 2, name: 'Release Radar', desc: 'New releases', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop', tracks: 25 },
  { id: 3, name: 'Daily Mix 1', desc: 'Based on listening', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop', tracks: 50 },
  { id: 4, name: 'Chill Hits', desc: 'Relax & unwind', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop', tracks: 80 },
  { id: 5, name: 'Top Hits 2024', desc: 'Most popular', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop', tracks: 100 },
];

const ACTIVE_ROOMS = [
  { id: 1, name: 'Chill Zone', host: 'DJ_Alex', listeners: 12, genre: 'Lo-Fi' },
  { id: 2, name: 'Workout Energy', host: 'FitBeats', listeners: 8, genre: 'EDM' },
  { id: 3, name: 'Late Night Vibes', host: 'MoonChild', listeners: 23, genre: 'R&B' },
];

export default function Feed({ token, isDemoMode = false }) {
  const [recentTracks, setRecentTracks] = useState([]);
  const [playlists, setPlaylists] = useState(DEMO_PLAYLISTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode || !token) {
      setRecentTracks([]);
      setPlaylists(DEMO_PLAYLISTS);
      setLoading(false);
      return;
    }

    // Fetch recently played tracks and user playlists from Spotify
    Promise.all([
      apiClient.get('me/player/recently-played', { params: { limit: 6 } }).catch(() => null),
      apiClient.get('me/playlists', { params: { limit: 5 } }).catch(() => null),
    ]).then(([recentRes, playlistRes]) => {
      if (recentRes?.data?.items) {
        setRecentTracks(recentRes.data.items.map((item, i) => ({
          id: item.track?.id || i,
          name: item.track?.name || 'Unknown',
          artist: item.track?.artists?.map(a => a.name).join(', ') || 'Unknown',
          cover: item.track?.album?.images?.[2]?.url || item.track?.album?.images?.[0]?.url || '',
          playedAt: item.played_at ? new Date(item.played_at) : null,
        })));
      }

      if (playlistRes?.data?.items) {
        setPlaylists(playlistRes.data.items.map((pl) => ({
          id: pl.id,
          name: pl.name,
          desc: pl.description || `${pl.tracks?.total || 0} tracks`,
          cover: pl.images?.[0]?.url || 'https://via.placeholder.com/200',
          tracks: pl.tracks?.total || 0,
        })));
      }
    }).finally(() => setLoading(false));
  }, [token, isDemoMode]);

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <Screencontainer>
        <div className="flex h-full items-center justify-center">
          <p className="text-slate-400">Loading feed...</p>
        </div>
      </Screencontainer>
    );
  }

  return (
    <Screencontainer>
      <div className="h-full overflow-y-auto p-4 pb-40 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">🏠 Feed</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isDemoMode ? 'Demo feed • Try the room functionality!' : "What's happening in your music world"}
          </p>
        </div>

        {/* Active Listening Rooms */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">🎧 Active Rooms</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ACTIVE_ROOMS.map((room) => (
              <div
                key={room.id}
                className="cursor-pointer rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 transition-all hover:border-amber-200/30 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-200">{room.genre}</span>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                    <span className="text-xs text-slate-400">{room.listeners} listening</span>
                  </div>
                </div>
                <p className="font-semibold text-white">{room.name}</p>
                <p className="text-xs text-slate-400">Hosted by {room.host}</p>
                <button className="mt-3 w-full rounded-lg bg-amber-200/10 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-200/20 transition-colors">
                  Join Room
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Playlists (real or demo) */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {isDemoMode ? 'Made for you' : 'Your Playlists'}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="min-w-[140px] cursor-pointer rounded-xl bg-slate-800/50 p-3 transition-transform hover:scale-105 sm:min-w-[160px]"
              >
                <img
                  src={playlist.cover}
                  alt={playlist.name}
                  className="mb-3 aspect-square w-full rounded-lg object-cover shadow-lg"
                />
                <p className="truncate text-sm font-semibold text-white">{playlist.name}</p>
                <p className="text-xs text-slate-400">{playlist.desc}</p>
                <p className="mt-1 text-[10px] text-slate-500">{playlist.tracks} tracks</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Played (Spotify users) or Demo Activity */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {isDemoMode ? 'Recent Activity' : 'Recently Played'}
          </h2>
          <div className="space-y-1">
            {!isDemoMode && recentTracks.length > 0 ? (
              recentTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5 cursor-pointer"
                >
                  <img
                    src={track.cover}
                    alt={track.name}
                    className="h-9 w-9 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{track.name}</p>
                    <p className="truncate text-xs text-slate-400">{track.artist}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{formatTimeAgo(track.playedAt)}</span>
                </div>
              ))
            ) : (
              DEMO_ACTIVITY.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5"
                >
                  <img
                    src={activity.avatar}
                    alt={activity.user}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-white">{activity.user}</span>{' '}
                      {activity.action}
                    </p>
                    {activity.title && (
                      <p className="truncate text-xs text-amber-200/80">{activity.title}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Screencontainer>
  )
}
