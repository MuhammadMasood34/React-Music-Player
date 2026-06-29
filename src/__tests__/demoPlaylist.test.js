import {
  DEMO_TRACKS,
  DEMO_PLAYLIST_URIS,
  isDemoTrackUri,
  findDemoTrack,
} from '../data/demoPlaylist';

// ─── DEMO_TRACKS structure ────────────────────────────────────────────────────

describe('DEMO_TRACKS', () => {
  test('1. has at least one track', () => {
    expect(DEMO_TRACKS.length).toBeGreaterThan(0);
  });

  test('2. every track has an id', () => {
    DEMO_TRACKS.forEach((t) => expect(t.id).toBeTruthy());
  });

  test('3. every track has a name', () => {
    DEMO_TRACKS.forEach((t) => expect(t.name).toBeTruthy());
  });

  test('4. every track has a uri starting with demo:track:', () => {
    DEMO_TRACKS.forEach((t) => expect(t.uri).toMatch(/^demo:track:/));
  });

  test('5. every track has a positive durationMs', () => {
    DEMO_TRACKS.forEach((t) => expect(t.durationMs).toBeGreaterThan(0));
  });

  test('6. every track has an artistName', () => {
    DEMO_TRACKS.forEach((t) => expect(t.artistName).toBeTruthy());
  });

  test('7. every track has an albumImageUrl', () => {
    DEMO_TRACKS.forEach((t) => expect(t.albumImageUrl).toBeTruthy());
  });

  test('8. every track has an audioSrc', () => {
    DEMO_TRACKS.forEach((t) => expect(t.audioSrc).toBeTruthy());
  });

  test('9. all track ids are unique', () => {
    const ids = DEMO_TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('10. all track uris are unique', () => {
    const uris = DEMO_TRACKS.map((t) => t.uri);
    expect(new Set(uris).size).toBe(uris.length);
  });

  test('11. audioSrc paths start with /demo-songs/', () => {
    DEMO_TRACKS.forEach((t) => expect(t.audioSrc).toMatch(/^\/demo-songs\//));
  });

  test('12. durationMs is a number', () => {
    DEMO_TRACKS.forEach((t) => expect(typeof t.durationMs).toBe('number'));
  });
});

// ─── DEMO_PLAYLIST_URIS ───────────────────────────────────────────────────────

describe('DEMO_PLAYLIST_URIS', () => {
  test('13. length matches DEMO_TRACKS length', () => {
    expect(DEMO_PLAYLIST_URIS.length).toBe(DEMO_TRACKS.length);
  });

  test('14. contains all track uris', () => {
    DEMO_TRACKS.forEach((t) => expect(DEMO_PLAYLIST_URIS).toContain(t.uri));
  });

  test('15. all entries are strings', () => {
    DEMO_PLAYLIST_URIS.forEach((uri) => expect(typeof uri).toBe('string'));
  });

  test('16. order matches DEMO_TRACKS order', () => {
    DEMO_TRACKS.forEach((t, i) => expect(DEMO_PLAYLIST_URIS[i]).toBe(t.uri));
  });
});

// ─── isDemoTrackUri ───────────────────────────────────────────────────────────

describe('isDemoTrackUri', () => {
  test('17. returns true for demo:track:1', () => {
    expect(isDemoTrackUri('demo:track:1')).toBe(true);
  });

  test('18. returns true for demo:track:99', () => {
    expect(isDemoTrackUri('demo:track:99')).toBe(true);
  });

  test('19. returns false for spotify:track:abc', () => {
    expect(isDemoTrackUri('spotify:track:abc')).toBe(false);
  });

  test('20. returns false for empty string', () => {
    expect(isDemoTrackUri('')).toBeFalsy();
  });

  test('21. returns false for undefined', () => {
    expect(isDemoTrackUri(undefined)).toBeFalsy();
  });

  test('22. returns false for null', () => {
    expect(isDemoTrackUri(null)).toBeFalsy();
  });

  test('23. returns true for all DEMO_TRACKS uris', () => {
    DEMO_TRACKS.forEach((t) => expect(isDemoTrackUri(t.uri)).toBe(true));
  });
});

// ─── findDemoTrack ────────────────────────────────────────────────────────────

describe('findDemoTrack', () => {
  test('24. finds first track by uri', () => {
    const track = findDemoTrack(DEMO_TRACKS[0].uri);
    expect(track).toBe(DEMO_TRACKS[0]);
  });

  test('25. finds last track by uri', () => {
    const last = DEMO_TRACKS[DEMO_TRACKS.length - 1];
    expect(findDemoTrack(last.uri)).toBe(last);
  });

  test('26. returns undefined for unknown uri', () => {
    expect(findDemoTrack('demo:track:999')).toBeUndefined();
  });

  test('27. returns undefined for undefined input', () => {
    expect(findDemoTrack(undefined)).toBeUndefined();
  });

  test('28. returns undefined for null input', () => {
    expect(findDemoTrack(null)).toBeUndefined();
  });

  test('29. returns undefined for empty string', () => {
    expect(findDemoTrack('')).toBeUndefined();
  });

  test('30. returned track has correct uri', () => {
    const uri = DEMO_TRACKS[1].uri;
    expect(findDemoTrack(uri)?.uri).toBe(uri);
  });

  test('31. returned track has audioSrc', () => {
    const track = findDemoTrack(DEMO_TRACKS[0].uri);
    expect(track?.audioSrc).toBeTruthy();
  });
});
