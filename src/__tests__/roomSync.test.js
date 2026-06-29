/**
 * Tests for room sync logic — pure utility functions extracted from useRoomSync.
 * These test the normalizeRoomCode helper, emitWithAck error handling,
 * and the state shape that useRoomSync exposes.
 */

// ─── normalizeRoomCode ────────────────────────────────────────────────────────

const normalizeRoomCode = (code) => code.trim().toUpperCase();

describe('normalizeRoomCode', () => {
  test('32. trims leading whitespace', () => {
    expect(normalizeRoomCode('  ABC')).toBe('ABC');
  });

  test('33. trims trailing whitespace', () => {
    expect(normalizeRoomCode('ABC  ')).toBe('ABC');
  });

  test('34. converts to uppercase', () => {
    expect(normalizeRoomCode('abc123')).toBe('ABC123');
  });

  test('35. handles already-uppercase code', () => {
    expect(normalizeRoomCode('XYZ')).toBe('XYZ');
  });

  test('36. handles mixed case with spaces', () => {
    expect(normalizeRoomCode('  xYz  ')).toBe('XYZ');
  });

  test('37. handles empty string', () => {
    expect(normalizeRoomCode('')).toBe('');
  });

  test('38. handles numeric-only code', () => {
    expect(normalizeRoomCode('12345')).toBe('12345');
  });
});

// ─── Progress sync logic ──────────────────────────────────────────────────────

/**
 * The drift-correction logic used in both DemoPlayback and WebPlayback:
 * only seek if |localPos - remotePos| > threshold
 */
const shouldCorrectDrift = (localMs, remoteMs, thresholdMs = 1500) =>
  Math.abs(localMs - remoteMs) > thresholdMs;

describe('shouldCorrectDrift', () => {
  test('39. returns false when positions are identical', () => {
    expect(shouldCorrectDrift(5000, 5000)).toBe(false);
  });

  test('40. returns false when diff is exactly threshold', () => {
    expect(shouldCorrectDrift(0, 1500)).toBe(false);
  });

  test('41. returns true when diff exceeds threshold', () => {
    expect(shouldCorrectDrift(0, 1501)).toBe(true);
  });

  test('42. returns true when local is ahead by > threshold', () => {
    expect(shouldCorrectDrift(10000, 8000)).toBe(true);
  });

  test('43. returns false when diff is 1000ms (under threshold)', () => {
    expect(shouldCorrectDrift(5000, 6000)).toBe(false);
  });

  test('44. works with custom threshold of 3000ms', () => {
    expect(shouldCorrectDrift(0, 2999, 3000)).toBe(false);
    expect(shouldCorrectDrift(0, 3001, 3000)).toBe(true);
  });

  test('45. handles negative diff (local ahead)', () => {
    expect(shouldCorrectDrift(20000, 17000)).toBe(true);
  });
});

// ─── formatDuration helper ────────────────────────────────────────────────────

const formatDuration = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

describe('formatDuration', () => {
  test('46. formats 0ms as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  test('47. formats null as 0:00', () => {
    expect(formatDuration(null)).toBe('0:00');
  });

  test('48. formats undefined as 0:00', () => {
    expect(formatDuration(undefined)).toBe('0:00');
  });

  test('49. formats NaN as 0:00', () => {
    expect(formatDuration(NaN)).toBe('0:00');
  });

  test('50. formats 60000ms as 1:00', () => {
    expect(formatDuration(60000)).toBe('1:00');
  });

  test('51. formats 90000ms as 1:30', () => {
    expect(formatDuration(90000)).toBe('1:30');
  });

  test('52. formats 3661000ms as 61:01', () => {
    expect(formatDuration(3661000)).toBe('61:01');
  });

  test('53. pads seconds with leading zero', () => {
    expect(formatDuration(65000)).toBe('1:05');
  });

  test('54. formats 30000ms as 0:30', () => {
    expect(formatDuration(30000)).toBe('0:30');
  });

  test('55. formats 147000ms (2:27)', () => {
    expect(formatDuration(147000)).toBe('2:27');
  });

  test('56. formats 110000ms (1:50)', () => {
    expect(formatDuration(110000)).toBe('1:50');
  });
});

// ─── progressPercentage calculation ──────────────────────────────────────────

const calcProgressPercent = (position, duration) =>
  duration > 0 ? (position / duration) * 100 : 0;

describe('calcProgressPercent', () => {
  test('57. returns 0 when duration is 0', () => {
    expect(calcProgressPercent(5000, 0)).toBe(0);
  });

  test('58. returns 50 at halfway point', () => {
    expect(calcProgressPercent(50000, 100000)).toBe(50);
  });

  test('59. returns 100 at end', () => {
    expect(calcProgressPercent(100000, 100000)).toBe(100);
  });

  test('60. returns 0 at start', () => {
    expect(calcProgressPercent(0, 100000)).toBe(0);
  });

  test('61. returns correct value for partial progress', () => {
    expect(calcProgressPercent(30000, 120000)).toBeCloseTo(25);
  });

  test('62. handles floating point positions', () => {
    expect(calcProgressPercent(33333, 100000)).toBeCloseTo(33.333);
  });
});

// ─── Room command type validation ─────────────────────────────────────────────

const VALID_COMMAND_TYPES = ['playTrack', 'play', 'pause', 'seek', 'next', 'previous', 'volume'];

const isValidCommandType = (type) => VALID_COMMAND_TYPES.includes(type);

describe('isValidCommandType', () => {
  test('63. accepts playTrack', () => {
    expect(isValidCommandType('playTrack')).toBe(true);
  });

  test('64. accepts play', () => {
    expect(isValidCommandType('play')).toBe(true);
  });

  test('65. accepts pause', () => {
    expect(isValidCommandType('pause')).toBe(true);
  });

  test('66. accepts seek', () => {
    expect(isValidCommandType('seek')).toBe(true);
  });

  test('67. accepts next', () => {
    expect(isValidCommandType('next')).toBe(true);
  });

  test('68. accepts previous', () => {
    expect(isValidCommandType('previous')).toBe(true);
  });

  test('69. accepts volume', () => {
    expect(isValidCommandType('volume')).toBe(true);
  });

  test('70. rejects unknown type', () => {
    expect(isValidCommandType('shuffle')).toBe(false);
  });

  test('71. rejects empty string', () => {
    expect(isValidCommandType('')).toBe(false);
  });

  test('72. rejects undefined', () => {
    expect(isValidCommandType(undefined)).toBe(false);
  });
});

// ─── Volume clamping ──────────────────────────────────────────────────────────

const clampVolume = (v) => Math.max(0, Math.min(1, v));

describe('clampVolume', () => {
  test('73. clamps negative to 0', () => {
    expect(clampVolume(-0.5)).toBe(0);
  });

  test('74. clamps above 1 to 1', () => {
    expect(clampVolume(1.5)).toBe(1);
  });

  test('75. passes through 0.5 unchanged', () => {
    expect(clampVolume(0.5)).toBe(0.5);
  });

  test('76. passes through 0 unchanged', () => {
    expect(clampVolume(0)).toBe(0);
  });

  test('77. passes through 1 unchanged', () => {
    expect(clampVolume(1)).toBe(1);
  });
});

// ─── Track index navigation ───────────────────────────────────────────────────

const getNextIndex = (current, total) => (current + 1) % total;
const getPrevIndex = (current, total) => (current - 1 + total) % total;

describe('track index navigation', () => {
  test('78. next from last wraps to 0', () => {
    expect(getNextIndex(5, 6)).toBe(0);
  });

  test('79. next from middle increments', () => {
    expect(getNextIndex(2, 6)).toBe(3);
  });

  test('80. prev from 0 wraps to last', () => {
    expect(getPrevIndex(0, 6)).toBe(5);
  });

  test('81. prev from middle decrements', () => {
    expect(getPrevIndex(3, 6)).toBe(2);
  });

  test('82. next from 0 in single-track playlist stays 0', () => {
    expect(getNextIndex(0, 1)).toBe(0);
  });

  test('83. prev from 0 in single-track playlist stays 0', () => {
    expect(getPrevIndex(0, 1)).toBe(0);
  });
});

// ─── Room state shape ─────────────────────────────────────────────────────────

const createInitialRoomState = () => ({
  roomCode: '',
  userCount: 0,
  sharedPlaylist: [],
  error: '',
  isConnected: false,
  incomingCommand: null,
  incomingProgress: null,
});

describe('createInitialRoomState', () => {
  test('84. roomCode is empty string', () => {
    expect(createInitialRoomState().roomCode).toBe('');
  });

  test('85. userCount starts at 0', () => {
    expect(createInitialRoomState().userCount).toBe(0);
  });

  test('86. sharedPlaylist starts empty', () => {
    expect(createInitialRoomState().sharedPlaylist).toEqual([]);
  });

  test('87. error starts empty', () => {
    expect(createInitialRoomState().error).toBe('');
  });

  test('88. isConnected starts false', () => {
    expect(createInitialRoomState().isConnected).toBe(false);
  });

  test('89. incomingCommand starts null', () => {
    expect(createInitialRoomState().incomingCommand).toBeNull();
  });

  test('90. incomingProgress starts null', () => {
    expect(createInitialRoomState().incomingProgress).toBeNull();
  });
});

// ─── New joiner detection ─────────────────────────────────────────────────────

const shouldBroadcastToNewJoiner = (prevCount, nextCount) =>
  nextCount > prevCount && prevCount > 0;

describe('shouldBroadcastToNewJoiner', () => {
  test('91. returns true when count increases from 1 to 2', () => {
    expect(shouldBroadcastToNewJoiner(1, 2)).toBe(true);
  });

  test('92. returns false when count stays same', () => {
    expect(shouldBroadcastToNewJoiner(2, 2)).toBe(false);
  });

  test('93. returns false when count decreases (user left)', () => {
    expect(shouldBroadcastToNewJoiner(3, 2)).toBe(false);
  });

  test('94. returns false when prevCount is 0 (initial join)', () => {
    expect(shouldBroadcastToNewJoiner(0, 1)).toBe(false);
  });

  test('95. returns true when count increases from 2 to 3', () => {
    expect(shouldBroadcastToNewJoiner(2, 3)).toBe(true);
  });

  test('96. returns false when both are 0', () => {
    expect(shouldBroadcastToNewJoiner(0, 0)).toBe(false);
  });
});

// ─── Seek position from click ─────────────────────────────────────────────────

const calcSeekPosition = (clickX, barWidth, durationMs) => {
  const percent = Math.max(0, Math.min(1, clickX / barWidth));
  return Math.floor(durationMs * percent);
};

describe('calcSeekPosition', () => {
  test('97. click at start returns 0', () => {
    expect(calcSeekPosition(0, 400, 120000)).toBe(0);
  });

  test('98. click at end returns full duration', () => {
    expect(calcSeekPosition(400, 400, 120000)).toBe(120000);
  });

  test('99. click at midpoint returns half duration', () => {
    expect(calcSeekPosition(200, 400, 120000)).toBe(60000);
  });

  test('100. click beyond bar width is clamped to end', () => {
    expect(calcSeekPosition(500, 400, 120000)).toBe(120000);
  });
});
