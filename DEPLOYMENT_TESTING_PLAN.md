# Deployment Testing Plan

## Task Summary

The goal is to make the deployed music player convenient for visitors to test on Vercel without requiring Spotify login on first load. The app should show a polished, working UI immediately, allow users to create and join rooms from normal and incognito browser sessions, and provide playable demo songs even when the visitor does not have a Spotify Premium account.

The main product problem is that Spotify Web Playback SDK full-track playback is restricted to Premium accounts. Because many visitors will not have Premium, the deployed project needs a fallback experience that still demonstrates the core room, playlist, and playback UI.

## Current Architecture

- Frontend: React/Vite app.
- Spotify auth and API client: `spotify.js`.
- Main authenticated app shell: `src/screens/home.jsx`.
- Room/player screen: `src/screens/players.jsx`.
- Spotify playback SDK wrapper: `src/components/WebPlayback.jsx`.
- Playlist/song list UI: `src/components/MusicCard.jsx`.
- Sidebar profile fetch: `src/components/sidebar.jsx`.
- Playlist library fetch: `src/screens/library.jsx`.
- Room sync hook: `src/hooks/useRoomSync.js`.
- Backend/socket room support: `base_server`, with Socket.IO room events for joining rooms, sharing playlists, and broadcasting playback commands.

Current behavior is Spotify-first: users are routed through Spotify login before the app becomes usable. Playback attempts use Spotify Web Playback SDK and Spotify Connect endpoints, which work reliably only for Premium users.

## Key Constraints

- Spotify Free users cannot use full Web Playback SDK streaming in the browser.
- Spotify playback endpoints such as transfer playback and start playback can return `403` for non-Premium users.
- Some Spotify playlist/profile requests can also fail for deployment/test users because of scopes, private playlist access, app mode restrictions, or account access.
- Incognito users should be treated as fresh guest clients, so room testing should not depend on an existing Spotify token in local storage.

## Decisions Made

1. The deployed app should default to guest/demo mode.
2. Spotify login should become optional, not required on app start.
3. Demo mode should include local seed playlist data so the UI can render without Spotify API responses.
4. Demo mode should include playable non-Spotify audio files so visitors can test playback without Premium.
5. Spotify Premium users should still be able to connect Spotify and use full Spotify playback.
6. Spotify Free users should remain in the app, see a clear Premium limitation message, and be offered demo songs.
7. Room functionality should work in both guest/demo mode and Spotify mode.
8. A full custom login/signup system is not a first priority unless persistent user profiles, saved rooms, or account-owned data are needed later.

## Recommended User Flow

```text
Visitor opens Vercel app
-> App loads directly into demo mode
-> Demo playlist and player UI are visible
-> Visitor can create a room
-> Incognito visitor can join the same room
-> Demo songs can play and room state can sync
-> Optional: visitor connects Spotify
-> If Spotify Premium: enable full Spotify Web Playback
-> If Spotify Free: keep demo playback and show Premium limitation message
```

## Suggested UI States

- Guest/demo user:
  - Show the full app UI.
  - Show demo playlists.
  - Show an optional "Connect Spotify" button.
  - Allow room creation and joining.

- Spotify Free user:
  - Show a message bar: "Spotify Premium is required for full Spotify playback. You can still test rooms using the demo songs below."
  - Disable or hide full Spotify playback controls.
  - Allow demo song playback and room testing.

- Spotify Premium user:
  - Enable Web Playback SDK.
  - Enable Spotify Connect playback commands.
  - Allow real Spotify playlist playback.

## Playlist Strategy

To maintain playlist songs without requiring Spotify auth, add a demo playlist source independent of Spotify:

```text
demo playlist data
-> track id
-> title
-> artist
-> album image
-> duration
-> demo audio URL
-> optional fake/internal URI
```

This demo data can live in the frontend initially. Later, it can move to the backend if the app needs admin-managed playlists or dynamic demo content.

## Playback Strategy

Use different playback paths depending on user/account state:

- Demo/guest playback:
  - Use local or hosted royalty-free audio files.
  - Use the browser audio element.
  - Sync playback commands through the existing room socket flow.

- Spotify Premium playback:
  - Use Web Playback SDK.
  - Use `/me/player` and `/me/player/play` endpoints.
  - Sync selected track and room state through sockets.

- Spotify Free playback:
  - Do not retry Spotify playback endpoints after `403`.
  - Offer demo songs.
  - Optionally provide "Open in Spotify" links for real Spotify tracks.

## Files Changed

No application code has been changed for this planning task.

Created:

- `DEPLOYMENT_TESTING_PLAN.md`

## Remaining Work

- Add a demo playlist data module.
- Add demo audio assets or hosted royalty-free audio URLs.
- Change app startup so unauthenticated users enter demo mode instead of the Spotify login screen.
- Add account/playback mode state: guest, Spotify Free, Spotify Premium.
- Guard Spotify Web Playback SDK initialization so it only runs for eligible Premium users.
- Add a message bar for Free/non-Premium users.
- Update `MusicCard` to support both Spotify track objects and demo track objects.
- Update room sync so demo playback commands and Spotify playback commands share a consistent command shape.
- Test room creation/joining between normal and incognito browser sessions.
- Test Vercel deployment with no token in local storage.

## Next Steps

1. Implement demo mode routing/startup.
2. Add a small, polished demo playlist with playable audio.
3. Adapt `MusicCard` and player controls to support demo tracks.
4. Add account-state detection and Premium limitation messaging.
5. Keep Spotify login optional inside the app.
6. Verify room sync across two browser sessions before deploying.

