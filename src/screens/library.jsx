import Screencontainer from '../shared/screencontainer'
import React, { useState, useEffect } from "react";
import apiClient from "../../spotify";
import { useNavigate } from "react-router-dom"

const DEMO_PLAYLISTS = [
  { id: 'demo-1', name: 'Chill Vibes', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' }], tracks: { total: 12 }, description: 'Relax and unwind with these mellow beats' },
  { id: 'demo-2', name: 'Workout Pump', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop' }], tracks: { total: 20 }, description: 'High energy tracks to fuel your workout' },
  { id: 'demo-3', name: 'Study Focus', images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop' }], tracks: { total: 15 }, description: 'Concentration-boosting instrumentals' },
  { id: 'demo-4', name: 'Road Trip', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop' }], tracks: { total: 25 }, description: 'Songs for the open road' },
  { id: 'demo-5', name: 'Late Night Jazz', images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop' }], tracks: { total: 18 }, description: 'Smooth jazz for late nights' },
  { id: 'demo-6', name: 'Throwback Hits', images: [{ url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop' }], tracks: { total: 30 }, description: 'Classic hits from the past decades' },
  { id: 'demo-7', name: 'Indie Discoveries', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' }], tracks: { total: 22 }, description: 'Fresh indie artists and hidden gems' },
  { id: 'demo-8', name: 'Party Mix', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop' }], tracks: { total: 35 }, description: 'Get the party started' },
];

export default function Library() {
  const [playlist, setPlaylists] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [playlistBoolean, setPlaylistBoolean] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const navigate = useNavigate();

  const isDemoMode = localStorage.getItem("demoMode") === "true";

  //API calls
  useEffect(() => {
    if (isDemoMode) {
      // Use demo playlists in demo mode
      setPlaylists(DEMO_PLAYLISTS);
      return;
    }

    apiClient.get("me/playlists").then(function (response) {
      setPlaylists(response.data.items);
      console.log(response.data.items);
    }).catch(() => {
      // Fallback to demo playlists if API fails
      setPlaylists(DEMO_PLAYLISTS);
    });
  }, []);


  const handlePlaylistClick = async (playlistId) => {
    if (isDemoMode) {
      // In demo mode, navigate to players page
      navigate("/players");
      return;
    }

    try {
      console.log("Clicked playlist:", playlistId);
      setSelectedPlaylistId(playlistId);

      const response = await apiClient.get(`playlists/${playlistId}/tracks`);
      setTracks(response.data.items);
      console.log("Tracks:", response.data.items);

      if (playlistBoolean) {
        navigate("/players", { state: { playlistId } });
      }

    } catch (error) {
      console.error("ERROR:", error);
    }
  };

  return (
    <Screencontainer>
      <div className='h-full overflow-y-auto bg-[#1E2A3E] p-4 pb-40 sm:p-6'>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">📚 Library</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isDemoMode ? 'Demo playlists • Click to explore' : 'Your playlists'}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {playlist?.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                handlePlaylistClick(item.id)
                setPlaylistBoolean(true)
              }}
              className='min-w-0 rounded-lg bg-[linear-gradient(75deg,rgb(40,58,88)_0%,rgba(54,69,98,0)_100%)] p-2 text-left transition duration-200 hover:-translate-y-1 hover:scale-[1.02]'
            >
              {item.images?.[0]?.url && (
                <img src={item.images[0].url} className='aspect-square w-full rounded-lg object-cover' alt='Playlist Art' />
              )}
              <p className='mt-3 truncate text-sm font-extrabold text-[#c4d0e3] sm:text-base'>{item.name}</p>
              <p className='mt-1 text-xs font-normal text-[#c4d0e37c]'>{item.tracks?.total ?? 0} tracks</p>
              {item.description && (
                <p className='mt-1 truncate text-[10px] text-slate-500'>{item.description}</p>
              )}
              {!isDemoMode && selectedPlaylistId === item.id && tracks.slice(0, 3).map((trackItem) => (
                <p key={trackItem.track.id} className='mt-1 truncate text-xs font-normal text-[#c4d0e37c]'>
                  {trackItem.track.name}
                </p>
              ))}
            </button>
          ))}
        </div>
      </div>
    </Screencontainer>
  )
}
