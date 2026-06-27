// Demo playlist for non-premium Spotify users
// These are royalty-free tracks hosted in public/demo-songs/
// You can add more MP3 files to public/demo-songs/ and register them here

export const DEMO_TRACKS = [
  {
    id: 'demo-1',
    name: 'Peaceful Garden',
    uri: 'demo:track:1',
    durationMs: 147000,
    artistName: 'Ambient Sounds',
    albumImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    audioSrc: '/demo-songs/track1.mp3',
  },
  {
    id: 'demo-2',
    name: 'Chill Lo-Fi Beat',
    uri: 'demo:track:2',
    durationMs: 110000,
    artistName: 'Lo-Fi Dreams',
    albumImageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    audioSrc: '/demo-songs/track2.mp3',
  },
  {
    id: 'demo-3',
    name: 'Electronic Pulse',
    uri: 'demo:track:3',
    durationMs: 156000,
    artistName: 'Synth Wave',
    albumImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    audioSrc: '/demo-songs/track3.mp3',
  },
  {
    id: 'demo-4',
    name: 'Summer Breeze',
    uri: 'demo:track:4',
    durationMs: 190000,
    artistName: 'Acoustic Vibes',
    albumImageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
    audioSrc: '/demo-songs/track4.mp3',
  },
  {
    id: 'demo-5',
    name: 'Night Drive',
    uri: 'demo:track:5',
    durationMs: 144000,
    artistName: 'Retro Beats',
    albumImageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    audioSrc: '/demo-songs/track5.mp3',
  },
  {
    id: 'demo-6',
    name: 'Morning Coffee',
    uri: 'demo:track:6',
    durationMs: 24000,
    artistName: 'Jazz Cafe',
    albumImageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop',
    audioSrc: '/demo-songs/track6.mp3',
  },
];

export const DEMO_PLAYLIST_URIS = DEMO_TRACKS.map((track) => track.uri);

export const isDemoTrackUri = (uri) => uri?.startsWith('demo:track:');

export const findDemoTrack = (uri) => DEMO_TRACKS.find((track) => track.uri === uri);
