import React from "react";
import { loginWithSpotify } from "../../../spotify.js"



export default function Login() {
  const handleDemoMode = () => {
    localStorage.setItem("demoMode", "true");
    // Reload the page so Home component detects demo mode
    window.location.reload();
  };

  return (
    <>
    
    <div className="bg-black h-screen w-screen flex items-center justify-center overflow-hidden flex-col gap-6">
      <img
        src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
        alt="logo-spotify"
        className="w-[30%]"
      />
      <a className="no-underline" onClick={loginWithSpotify}>
        <div className="w-[200px] py-[15px] px-[0px] text-center bg-white rounded-4xl text-[#1f1f1f] font-semibold cursor-pointer hover:bg-gray-200 transition-colors">LOG IN</div>
      </a>

      {/* Divider */}
      <div className="flex items-center gap-3 w-[280px]">
        <div className="flex-1 h-px bg-gray-600"></div>
        <span className="text-gray-400 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-600"></div>
      </div>

      {/* Demo Mode Button */}
      <button
        onClick={handleDemoMode}
        className="w-[280px] py-[14px] px-[0px] text-center bg-emerald-500 rounded-4xl text-white font-semibold cursor-pointer hover:bg-emerald-400 transition-colors"
      >
        🎵 Try Demo Mode
      </button>
      <p className="text-gray-500 text-xs text-center max-w-[300px] -mt-2">
        No Spotify Premium needed! Test the room functionality with free demo songs.
      </p>
    </div>

    </>
  )
}
