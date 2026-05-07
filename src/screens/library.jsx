
// import Screencontainer from '../shared/screencontainer'
// import React, { useState, useEffect } from "react";
// import apiClient from "../../spotify";

// export default function Library() {
//   const [playlist, setPlaylists] = useState(null);
//   const [tracks, setTracks] = useState([]);
//   const [playlistBoolean, setPlaylistBoolean] = useState (false);

//   useEffect(() => {
//     apiClient.get("me/playlists").then(function (response) {
//       setPlaylists(response.data.items);
//       console.log(response.data.items);
//     });
//   }, []);

//   const handlePlaylistClick = async (playlistId) => {
//     try {
//       console.log("Clicked playlist:", playlistId);

//       const response = await apiClient.get(`playlists/${playlistId}`);

//       console.log("API response:", response);

//       const songs = response.data.items.items.map(item => item.item?.name);

//       console.log("Songs:", songs);

//       const durations = response.data.items.items.map(item => item.item?.duration_ms/1000/60);

//       console.log("Durations:", durations);

//       const Images = response.data.items.items.map(item => item.item?.album.images[2]);

//       console.log("Images:", Images);

//       const Artists = response.data.items.items.map(item => item.item?.artists[0].name);

//       console.log("Artists:", Artists);

//       alert(songs.join("\n"));

//     } catch (error) {
//       console.error("ERROR:", error);
//     }
//   };
//   return (
//     // <div className='w-[calc(100%-100px)] h-screen bg-[#1E2A3E] rounded-xl'>library</div>
//     <Screencontainer prop={playlist}>

//       <div className='w-[calc(100%-100px)] h-screen bg-[#1E2A3E] rounded-xl flex flex-wrap overflow-y-auto justify-between '>
//         <div prop={playlist} className=' w-[15%] h-[40%] rounded-[20px] bg-[rgb(30, 42, 62)] p-[1px] mb-[2%] bg-[linear-gradient(75deg,rgb(40,58,88)_0%,rgba(54,69,98,0)_100%)] mt-6 ml-6 transition delay-30 duration-250 ease-in-out hover:-translate-y-1 hover:scale-110 cursor-pointer' onClick={() => alert("get here")}>

//           {playlist?.map((playlist) => (

//             <div 

//               onClick={() => {
//                 handlePlaylistClick(playlist.id) 
//                 setPlaylistBoolean(true)
//               }}
//             >
//               {playlist.images?.[0]?.url && (
//                 <img src={playlist.images[0].url} className='w-full rounded-[20px]' alt='Playlist Art' />
//               )}
//               <p className='font-extrabold font-[16px] text-[#c4d0e3] mt-[10px] mb-[10px] ml-[10px] mr-[0px]'>{playlist.name}</p>
//               <p className='font-normal text-[12px] ml-[10px] text-[#c4d0e37c] '>{playlist.items?.total ?? 0} tracks</p>
//               {tracks.map((trackItem) => (
//                 <p key={trackItem.track.id} className='font-normal text-[12px] ml-[10px] text-[#c4d0e37c]'>
//                   {trackItem.track.name}
//                 </p>
//               ))}
//             </div>

//           ))}
//         </div>

//       </div>

//     </Screencontainer>

//   )
// }


// code before 8:17 pm 4/16/2026
// import Screencontainer from '../shared/screencontainer'
// import React, { useState, useEffect } from "react";
// import apiClient from "../../spotify";
// import MusicCard from '../components/MusicCard';
// import { useNavigate } from "react-router-dom"

// export default function Library() {
//   const [playlist, setPlaylists] = useState(null);
//   const [tracks, setTracks] = useState([]);
//   const [playlistBoolean, setPlaylistBoolean] = useState(false);
//   const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
//   const navigate = useNavigate();

//   //API calls
//   useEffect(() => {
//     apiClient.get("me/playlists").then(function (response) {
//       setPlaylists(response.data.items);
//       console.log(response.data.items);
//     });
//   }, []);

//   const handlePlaylistClick = async (playlistId) => {
//     try {
//       console.log("Clicked playlist:", playlistId);
//       setSelectedPlaylistId(playlistId);

//       const response = await apiClient.get(`playlists/${playlistId}`);

//       console.log("API response:", response);

//       const songs = response.data.items.items.map(item => item.item?.name);

//       console.log("Songs:", songs);

//       const durations = response.data.items.items.map(item => item.item?.duration_ms / 1000 / 60);

//       console.log("Durations:", durations);

//       const Images = response.data.items.items.map(item => item.item?.album.images[2]);

//       console.log("Images:", Images);

//       const Artists = response.data.items.items.map(item => item.item?.artists[0].name);

//       console.log("Artists:", Artists);

//       // Navigate to players section

//       if (playlistBoolean) {
//         navigate("/players");
//       }

//     } catch (error) {
//       console.error("ERROR:", error);
//     }
//   };

//   return (
//     <Screencontainer prop={playlist}>
//       <div className='w-[calc(100%-100px)] h-screen bg-[#1E2A3E] rounded-xl flex flex-wrap overflow-y-auto justify-between '>
//         <div prop={playlist} className=' w-[15%] h-[40%] rounded-[20px] bg-[rgb(30,42,62)] p-[1px] mb-[2%] bg-[linear-gradient(75deg,rgb(40,58,88)_0%,rgba(54,69,98,0)_100%)] mt-6 ml-6 transition delay-30 duration-250 ease-in-out hover:-translate-y-1 hover:scale-110 cursor-pointer' >

//           {playlist?.map((playlist) => (
//             <div
//               key={playlist.id}
//               onClick={() => {
//                 handlePlaylistClick(playlist.id)
//                 setPlaylistBoolean(true)
//               }}
//             >
//               {playlist.images?.[0]?.url && (
//                 <img src={playlist.images[0].url} className='w-full rounded-[20px]' alt='Playlist Art' />
//               )}
//               <p className='font-extrabold font-[16px] text-[#c4d0e3] mt-[10px] mb-[10px] ml-[10px] mr-[0px]'>{playlist.name}</p>
//               <p className='font-normal text-[12px] ml-[10px] text-[#c4d0e37c] '>{playlist.items?.total ?? 0} tracks</p>
//               {tracks.map((trackItem) => (
//                 <p key={trackItem.track.id} className='font-normal text-[12px] ml-[10px] text-[#c4d0e37c]'>
//                   {trackItem.track.name}
//                 </p>
//               ))}
//             </div>
//           ))}
//         </div>
//       </div>
//     </Screencontainer>
//   )
// }



import Screencontainer from '../shared/screencontainer'
import React, { useState, useEffect } from "react";
import apiClient from "../../spotify";
import MusicCard from '../components/MusicCard';
import { useNavigate } from "react-router-dom"

export default function Library() {
  const [playlist, setPlaylists] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [playlistBoolean, setPlaylistBoolean] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const navigate = useNavigate();

  //API calls
  useEffect(() => {
    apiClient.get("me/playlists").then(function (response) {
      setPlaylists(response.data.items);
      console.log(response.data.items);
    });
  }, []);


  const playTrack = async (trackUri) => {
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });
  };


  const handlePlaylistClick = async (playlistId) => {
    try {
      console.log("Clicked playlist:", playlistId);
      setSelectedPlaylistId(playlistId);

      const response = await apiClient.get(`playlists/${playlistId}/tracks`); // ✅ add /tracks

      setTracks(response.data.items); // ✅ add this line

      console.log("Tracks:", response.data.items);

      if (playlistBoolean) {
        navigate("/players");
      }

    } catch (error) {
      console.error("ERROR:", error);
    }
  };
  return (
    <Screencontainer prop={playlist}>
      <div className='w-[calc(100%-100px)] h-screen bg-[#1E2A3E] rounded-xl flex flex-wrap overflow-y-auto justify-between '>
        <div prop={playlist} className=' w-[15%] h-[40%] rounded-[20px] bg-[rgb(30,42,62)] p-[1px] mb-[2%] bg-[linear-gradient(75deg,rgb(40,58,88)_0%,rgba(54,69,98,0)_100%)] mt-6 ml-6 transition delay-30 duration-250 ease-in-out hover:-translate-y-1 hover:scale-110 cursor-pointer' >

          {playlist?.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => {
                handlePlaylistClick(playlist.id)
                setPlaylistBoolean(true)
              }}
            >
              {playlist.images?.[0]?.url && (
                <img src={playlist.images[0].url} className='w-full rounded-[20px]' alt='Playlist Art' />
              )}
              <p className='font-extrabold font-[16px] text-[#c4d0e3] mt-[10px] mb-[10px] ml-[10px] mr-[0px]'>{playlist.name}</p>
              <p className='font-normal text-[12px] ml-[10px] text-[#c4d0e37c] '>{playlist.items?.total ?? 0} tracks</p>
              {selectedPlaylistId === playlist.id && tracks.map((trackItem) => (
                <p key={trackItem.track.id} className='font-normal text-[12px] ml-[10px] text-[#c4d0e37c]'>
                  {trackItem.track.name}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Screencontainer>
  )
}