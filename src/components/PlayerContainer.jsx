// PlayerContainer.jsx
import React, { useState } from 'react';
import MusicCard from './MusicCard';
import WebPlayback from './WebPlayback';

const PlayerContainer = ({ token, playlistId = "6nqDE6AngPtfuY2JmOILXw" }) => {
  // State variables to store:
  const [currentDeviceId, setCurrentDeviceId] = useState(null);  // Which device to play on
  const [currentTrackUri, setCurrentTrackUri] = useState(null); // Which song to play
  const [isPlaying, setIsPlaying] = useState(false);            // Should it play?

  // This function gets called when user clicks a track in MusicCard
  const handleTrackSelect = (trackUri, deviceId) => {
    setCurrentTrackUri(trackUri);      // Save the song URI
    setCurrentDeviceId(deviceId);      // Save the device ID
    setIsPlaying(true);                // Tell it to start playing
  };

  return (
    <div className="flex flex-col h-screen">
      {/* MusicCard component - shows playlist and sends track info when clicked */}
      <div className="flex-1 overflow-auto">
        <MusicCard 
          token={token}
          playlistId={playlistId}
          onTrackSelect={handleTrackSelect}  // Pass the function down as prop
          currentDeviceId={currentDeviceId}
        />
      </div>
      
      {/* WebPlayback component - actually plays the music */}
      <WebPlayback 
        token={token}
        trackUri={currentTrackUri}     // Pass the song to play
        deviceId={currentDeviceId}     // Pass which device to use
        shouldPlay={isPlaying}         // Pass play command
      />
    </div>
  );
};

export default PlayerContainer;
