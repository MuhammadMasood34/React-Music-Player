import React from 'react';
import { loginWithSpotify } from '../../spotify';

export default function SpotifyUpgradeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleContinue = () => {
    // Clear demo mode and redirect to Spotify login
    localStorage.removeItem("demoMode");
    loginWithSpotify();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-2xl border border-slate-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Spotify Logo */}
        <div className="mb-4 flex justify-center">
          <img
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png"
            alt="Spotify"
            className="h-10"
          />
        </div>

        {/* Disclaimer */}
        <div className="mb-6 text-center">
          <h2 className="mb-3 text-lg font-bold text-white">Connect Spotify Premium</h2>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-3">
            <p className="text-sm text-amber-200">
              ⚠️ You can play Spotify songs only if you have a <span className="font-bold">Premium account</span>.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Free Spotify accounts cannot stream full tracks. If you have Premium, you'll get access to millions of songs, your playlists, and full playback control.
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full rounded-full bg-[#1DB954] py-3 text-center font-semibold text-white hover:bg-[#1ed760] transition-colors"
        >
          Continue with Spotify
        </button>

        {/* Cancel text */}
        <p
          onClick={onClose}
          className="mt-3 cursor-pointer text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Stay in Demo Mode
        </p>
      </div>
    </div>
  );
}
