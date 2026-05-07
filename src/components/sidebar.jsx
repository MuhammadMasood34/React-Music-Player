import React, { useEffect, useState } from 'react'
import Sidebarbuttons from './sidebarbuttons'
import { MdFavorite } from 'react-icons/md';
import { FaGripfire, FaPlay } from 'react-icons/fa';
import { FaSignOutAlt } from 'react-icons/fa'
import { IoLibrary } from 'react-icons/io5';
import { MdSpaceDashboard } from 'react-icons/md';
import apiClient from '../../spotify';

export default function Sidebar({ token }) {
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
    <div className='w-[100px] h-full flex flex-col items-center justify-between'>
      <img src={image} alt="profile" className='w-[50px] h-[50px ] rounded-xl mt-[25px]' />
      <div>
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
