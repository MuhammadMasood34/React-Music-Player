import React from "react";
import { loginWithSpotify } from "../../../spotify.js"



export default function Login() {
  return (
    <>
    
    <div className="bg-black h-screen w-screen flex items-center justify-center overflow-hidden flex-col">
      <img
        src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
        alt="logo-spotify"
        className="w-[30%]"
      />
      <a className="no-underline" onClick={loginWithSpotify}>
        <div className="w-[200px] py-[15px] px-[0px] text-center bg-white rounded-4xl text-[#1f1f1f] font-semibold mt-[20px] cursor-pointer">LOG IN</div>
      </a>
    </div>

    {/* <button onClick={loginWithSpotify} className="w-[200px] py-[15px] px-[0px] text-center bg-white rounded-4xl text-[#1f1f1f] font-semibold mt-[20px]">Login with Spotify</button> */}

    </>
  )
}
