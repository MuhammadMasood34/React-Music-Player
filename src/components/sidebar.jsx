import React, { useEffect, useState } from 'react'
import Sidebarbuttons from './sidebarbuttons'
import { MdFavorite } from 'react-icons/md';
import { FaGripfire, FaPlay } from 'react-icons/fa';
import { FaSignOutAlt } from 'react-icons/fa'
import { IoLibrary } from 'react-icons/io5';
import { MdSpaceDashboard } from 'react-icons/md';
import apiClient from '../../spotify';

export default function Sidebar() {
  const [image, setImage] = useState("https://plus.unsplash.com/premium_photo-1731518243199-fe1e3d501b2b?q=80&w=1016&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");

  useEffect(() => {
    apiClient.get("me").then((response) => {
      console.log(response.data.images); // ← check what you actually get
      const profilePic = response.data.images?.[0]?.url;
      if (profilePic) {
        setImage(profilePic);
      }
      // if no image, keeps the default placeholder you already set
    }).catch((err) => console.error(err));
  }, []);

  return (
    <div className='flex w-full shrink-0 items-center justify-between gap-2 overflow-x-auto bg-blue-100 px-2 py-2 md:h-full md:w-[100px] md:flex-col md:overflow-visible md:bg-transparent md:px-0 md:py-0'>
      <img src={image} alt="profile" className='h-10 w-10 shrink-0 rounded-xl object-cover md:mt-[25px] md:h-[50px] md:w-[50px]' />
      <div className='flex items-center gap-1 md:block'>
        <Sidebarbuttons title="Feed" to="/feed" icon={<MdSpaceDashboard />} />
        <Sidebarbuttons title="Trending" to="/trending" icon={<FaGripfire />} />
        <Sidebarbuttons title="Player" to="/players" icon={<FaPlay />} />
        <Sidebarbuttons title="Favorites" to="/favorites" icon={<MdFavorite />} />
        <Sidebarbuttons title="Library" to="/library" icon={<IoLibrary />} />
      </div>
      <Sidebarbuttons title="Sign out" to="/" icon={<FaSignOutAlt />} />
    </div>
  )
}
