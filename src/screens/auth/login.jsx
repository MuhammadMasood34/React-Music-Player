import React from "react";
import { loginWithSpotify } from "../../../spotify.js"

export default function Login() {
  const handleDemoMode = () => {
    localStorage.setItem("demoMode", "true");
    window.location.reload();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden flex-col gap-5 bg-blue-200">
      {/* Project Title */}
      <h1 className="text-5xl font-bold text-slate-800 tracking-tight md:text-6xl">
        SyncWave
      </h1>

      {/* Project Description */}
      <p className="text-slate-600 text-lg text-center max-w-[320px] font-medium -mt-1">
        Gather your friends and listen together in Sync
      </p>

      {/* Demo Mode Button — appears first */}
      <button
        onClick={handleDemoMode}
        className="w-[280px] py-[14px] text-center bg-emerald-500 rounded-full text-white font-semibold cursor-pointer hover:bg-emerald-400 transition-colors shadow-md"
      >
        🎵 Try Demo Mode
      </button>
      <p className="text-slate-500 text-xs text-center max-w-[300px] -mt-2">
        No Spotify Premium needed! Test the room functionality with free demo songs.
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 w-[280px]">
        <div className="flex-1 h-px bg-slate-400"></div>
        <span className="text-slate-500 text-sm">or</span>
        <div className="flex-1 h-px bg-slate-400"></div>
      </div>

      {/* Spotify Login Button */}
      <a className="no-underline" onClick={loginWithSpotify}>
        <div className="w-[280px] py-[14px] text-center bg-[#1DB954] rounded-full text-white font-semibold cursor-pointer hover:bg-[#1ed760] transition-colors shadow-md flex items-center justify-center gap-2">
          <img
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
            alt="Spotify"
            className="h-5"
          />
          Continue with Spotify
        </div>
      </a>

      {/* Premium-only note */}
      <p className="text-slate-500 text-[11px] text-center max-w-[300px] -mt-2">
        ⚠️ Continue with Spotify only if you have a <span className="font-semibold">Premium account</span>.
      </p>
    </div>
  )
}
