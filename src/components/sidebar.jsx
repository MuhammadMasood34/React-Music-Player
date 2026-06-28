import React, { useEffect, useState } from 'react'
import Sidebarbuttons from './sidebarbuttons'
import { MdFavorite } from 'react-icons/md';
import { FaGripfire, FaPlay, FaSpotify } from 'react-icons/fa';
import { FaSignOutAlt } from 'react-icons/fa'
import { IoLibrary } from 'react-icons/io5';
import apiClient from '../../spotify';
import SpotifyUpgradeModal from './SpotifyUpgradeModal';

export default function Sidebar({ isDemoMode = false, onSignOut }) {
  const [image, setImage] = useState("https://plus.unsplash.com/premium_photo-1731518243199-fe1e3d501b2b?q=80&w=1016&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);

  useEffect(() => {
    if (isDemoMode) return; // Skip API call in demo mode

    apiClient.get("me").then((response) => {
      console.log(response.data.images);
      const profilePic = response.data.images?.[0]?.url;
      if (profilePic) {
        setImage(profilePic);
      }
    }).catch((err) => console.error(err));
  }, [isDemoMode]);

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <>
      <div className='flex w-full shrink-0 items-center justify-between gap-2 overflow-x-auto bg-blue-100 px-2 py-2 md:h-full md:w-[100px] md:flex-col md:overflow-visible md:bg-transparent md:px-0 md:py-0 md:pb-[140px]'>
        <img src={image} alt="profile" className='h-10 w-10 shrink-0 rounded-xl object-cover md:mt-[25px] md:h-[50px] md:w-[50px]' />
        <div className='flex items-center gap-1 md:block'>
          <Sidebarbuttons title="Trending" to="/trending" icon={<FaGripfire />} />
          <Sidebarbuttons title="Player" to="/" icon={<FaPlay />} />
          <Sidebarbuttons title="Favorites" to="/favorites" icon={<MdFavorite />} />
          <Sidebarbuttons title="Library" to="/library" icon={<IoLibrary />} />
        </div>

        {/* Spotify button - only visible in demo mode */}
        {isDemoMode && (
          <button
            onClick={() => setShowSpotifyModal(true)}
            className="shrink-0"
          >
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-blue-200 text-gray-500 hover:bg-blue-500 hover:text-white sm:w-20 md:mx-[20px] md:my-auto md:h-[80px] md:w-[80px] md:rounded-xl transition-colors cursor-pointer">
              <FaSpotify size="22px" />
              <p className='mx-auto mt-1 max-w-full truncate px-1 text-[10px] font-semibold sm:text-xs'>Spotify</p>
            </div>
          </button>
        )}

        {/* Sign Out - only for Spotify-authenticated users */}
        {!isDemoMode && (
          <button
            onClick={handleSignOut}
            className="shrink-0"
          >
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg text-gray-500 hover:text-white sm:w-20 md:mx-[20px] md:my-auto md:h-[80px] md:w-[80px] md:rounded-xl transition-colors cursor-pointer">
              <FaSignOutAlt size="22px" />
              <p className='mx-auto mt-1 max-w-full truncate px-1 text-[10px] font-semibold sm:text-xs'>Sign out</p>
            </div>
          </button>
        )}
      </div>

      {/* Spotify Upgrade Modal */}
      <SpotifyUpgradeModal
        isOpen={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
      />
    </>
  )
}
