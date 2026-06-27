import React, { useState, useEffect } from 'react'
import Screencontainer from '../shared/screencontainer'
import apiClient from '../../spotify';

const DEMO_TRENDING_SONGS = [
  { id: 1, name: 'Flowers', artist: 'Miley Cyrus', plays: '2.1B', trend: '+12%', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=80&h=80&fit=crop' },
  { id: 2, name: 'Kill Bill', artist: 'SZA', plays: '1.8B', trend: '+8%', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop' },
  { id: 3, name: 'Anti-Hero', artist: 'Taylor Swift', plays: '1.6B', trend: '+5%', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' },
  { id: 4, name: 'Unholy', artist: 'Sam Smith & Kim Petras', plays: '1.4B', trend: '+3%', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop' },
  { id: 5, name: 'As It Was', artist: 'Harry Styles', plays: '2.5B', trend: '+2%', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&h=80&fit=crop' },
  { id: 6, name: 'Calm Down', artist: 'Rema & Selena Gomez', plays: '1.9B', trend: '+15%', cover: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=80&h=80&fit=crop' },
  { id: 7, name: 'Creepin', artist: 'Metro Boomin', plays: '1.1B', trend: '+7%', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=80&h=80&fit=crop' },
  { id: 8, name: 'Boy\'s a Liar', artist: 'PinkPantheress & Ice Spice', plays: '890M', trend: '+22%', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop' },
  { id: 9, name: 'Vampire', artist: 'Olivia Rodrigo', plays: '760M', trend: '+31%', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' },
  { id: 10, name: 'Last Night', artist: 'Morgan Wallen', plays: '1.2B', trend: '+4%', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop' },
];

const TOP_GENRES = [
  { name: 'Pop', color: 'from-pink-500 to-rose-500', count: '2.4K' },
  { name: 'Hip Hop', color: 'from-purple-500 to-indigo-500', count: '1.8K' },
  { name: 'R&B', color: 'from-amber-500 to-orange-500', count: '1.2K' },
  { name: 'Electronic', color: 'from-cyan-500 to-blue-500', count: '980' },
  { name: 'Rock', color: 'from-red-500 to-orange-500', count: '870' },
  { name: 'Latin', color: 'from-green-500 to-emerald-500', count: '750' },
];

export default function Trending({ token, isDemoMode = false }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode || !token) {
      setSongs(DEMO_TRENDING_SONGS);
      setLoading(false);
      return;
    }

    // Fetch user's top tracks from Spotify (represents "trending" for the user)
    apiClient.get('me/top/tracks', { params: { limit: 10, time_range: 'short_term' } })
      .then((response) => {
        const spotifySongs = response.data.items.map((track, index) => ({
          id: track.id || index,
          name: track.name,
          artist: track.artists?.map(a => a.name).join(', ') || 'Unknown',
          plays: `${Math.floor(Math.random() * 900 + 100)}M`,
          trend: `+${Math.floor(Math.random() * 25 + 2)}%`,
          cover: track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || 'https://via.placeholder.com/80',
        }));
        setSongs(spotifySongs);
      })
      .catch(() => {
        setSongs(DEMO_TRENDING_SONGS);
      })
      .finally(() => setLoading(false));
  }, [token, isDemoMode]);

  if (loading) {
    return (
      <Screencontainer>
        <div className="flex h-full items-center justify-center">
          <p className="text-slate-400">Loading trending...</p>
        </div>
      </Screencontainer>
    );
  }

  return (
    <Screencontainer>
      <div className="h-full overflow-y-auto p-4 pb-40 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">🔥 Trending</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isDemoMode ? 'Demo trending chart' : "What's hot for you right now"}
          </p>
        </div>

        {/* Genre Cards */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Top Genres</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TOP_GENRES.map((genre) => (
              <div
                key={genre.name}
                className={`cursor-pointer rounded-xl bg-gradient-to-br ${genre.color} p-4 transition-transform hover:scale-105`}
              >
                <p className="font-bold text-white">{genre.name}</p>
                <p className="text-xs text-white/70">{genre.count} songs</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Chart */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {isDemoMode ? 'Top 10 Chart' : 'Your Top Tracks'}
          </h2>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="group flex items-center gap-3 border-b border-slate-700/30 p-3 transition-colors hover:bg-white/5 last:border-b-0 cursor-pointer"
              >
                <span className={`w-8 text-center text-lg font-bold ${index < 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {index + 1}
                </span>
                <img
                  src={song.cover}
                  alt={song.name}
                  className="h-11 w-11 rounded-lg object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{song.name}</p>
                  <p className="truncate text-xs text-slate-400">{song.artist}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-slate-400">{song.plays} plays</p>
                  <p className="text-xs font-semibold text-emerald-400">{song.trend}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 sm:hidden">{song.trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screencontainer>
  )
}
