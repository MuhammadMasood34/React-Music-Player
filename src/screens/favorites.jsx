import React, { useState, useEffect } from 'react'
import Screencontainer from '../shared/screencontainer'
import apiClient from '../../spotify';

const DEMO_FAVORITE_SONGS = [
  { id: 1, name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' },
  { id: 2, name: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: '3:23', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop' },
  { id: 3, name: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*ck Love 3', duration: '2:21', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&h=80&fit=crop' },
  { id: 4, name: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: '3:58', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=80&h=80&fit=crop' },
  { id: 5, name: 'Peaches', artist: 'Justin Bieber', album: 'Justice', duration: '3:18', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop' },
  { id: 6, name: 'Montero', artist: 'Lil Nas X', album: 'Montero', duration: '2:17', cover: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=80&h=80&fit=crop' },
  { id: 7, name: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', duration: '2:58', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' },
  { id: 8, name: 'Kiss Me More', artist: 'Doja Cat ft. SZA', album: 'Planet Her', duration: '3:28', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop' },
];

const formatDuration = (ms) => {
  if (!ms) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function Favorites({ token, isDemoMode = false }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode || !token) {
      setSongs(DEMO_FAVORITE_SONGS);
      setLoading(false);
      return;
    }

    // Fetch user's liked/saved tracks from Spotify
    apiClient.get('me/tracks', { params: { limit: 20 } })
      .then((response) => {
        const spotifySongs = response.data.items.map((item, index) => ({
          id: item.track.id || index,
          name: item.track.name,
          artist: item.track.artists?.map(a => a.name).join(', ') || 'Unknown',
          album: item.track.album?.name || '',
          duration: formatDuration(item.track.duration_ms),
          cover: item.track.album?.images?.[2]?.url || item.track.album?.images?.[0]?.url || 'https://via.placeholder.com/80',
        }));
        setSongs(spotifySongs);
      })
      .catch(() => {
        setSongs(DEMO_FAVORITE_SONGS);
      })
      .finally(() => setLoading(false));
  }, [token, isDemoMode]);

  if (loading) {
    return (
      <Screencontainer>
        <div className="flex h-full items-center justify-center">
          <p className="text-slate-400">Loading favorites...</p>
        </div>
      </Screencontainer>
    );
  }

  return (
    <Screencontainer>
      <div className="h-full overflow-y-auto p-4 pb-40 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">❤️ Favorites</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isDemoMode ? 'Demo liked songs' : 'Your liked songs collection'}
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-4">
          <div className="text-center">
            <p className="text-lg font-bold text-pink-300">{songs.length}</p>
            <p className="text-xs text-slate-400">Songs</p>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-purple-300">{songs.length > 0 ? `${Math.ceil(songs.length * 3.2)}m` : '0m'}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div className="ml-auto">
            <button className="rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-400 transition-colors">
              ▶ Play All
            </button>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5 cursor-pointer"
            >
              <span className="w-6 text-center text-sm text-slate-500 group-hover:hidden">
                {index + 1}
              </span>
              <span className="hidden w-6 text-center text-white group-hover:block">▶</span>
              <img
                src={song.cover}
                alt={song.name}
                className="h-10 w-10 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{song.name}</p>
                <p className="truncate text-xs text-slate-400">{song.artist}</p>
              </div>
              <span className="hidden text-xs text-slate-500 sm:block">{song.album}</span>
              <span className="text-xs text-slate-500 font-mono">{song.duration}</span>
              <button className="text-pink-400 opacity-0 transition-opacity group-hover:opacity-100">♥</button>
            </div>
          ))}
        </div>
      </div>
    </Screencontainer>
  )
}
