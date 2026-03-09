import { describe, it, expect } from 'vitest';
import { createHold, extendHold, isHoldExpired } from '../src/hold.js';

describe('createHold', () => {
  it('creates a hold with TTL', () => {
    const now = new Date('2026-03-01T12:00:00Z');
    const hold = createHold({
      id: 'h1',
      offeringId: 'dinner',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-03-01T19:00:00'),
          end: new Date('2026-03-01T19:30:00'),
          count: 1,
        },
      ],
      heldBy: 'user-1',
      ttl: { minutes: 10 },
      now,
    });

    expect(hold.id).toBe('h1');
    expect(hold.heldAt).toEqual(now);
    expect(hold.expiresAt).toEqual(new Date('2026-03-01T12:10:00Z'));
  });
});

describe('extendHold', () => {
  it('resets TTL from current time', () => {
    const hold = createHold({
      id: 'h1',
      offeringId: 'dinner',
      slots: [],
      heldBy: 'user-1',
      ttl: { minutes: 10 },
      now: new Date('2026-03-01T12:00:00Z'),
    });

    // Extend 5 minutes after creation
    const extended = extendHold(
      hold,
      { minutes: 10 },
      new Date('2026-03-01T12:05:00Z'),
    );

    // New expiry is 10 min from extension time, not from original hold time
    expect(extended.expiresAt).toEqual(new Date('2026-03-01T12:15:00Z'));
  });
});

describe('isHoldExpired', () => {
  it('returns false when hold is active', () => {
    const hold = createHold({
      id: 'h1',
      offeringId: 'o1',
      slots: [],
      heldBy: 'user-1',
      ttl: { minutes: 10 },
      now: new Date('2026-03-01T12:00:00Z'),
    });

    expect(isHoldExpired(hold, new Date('2026-03-01T12:05:00Z'))).toBe(false);
  });

  it('returns true when hold has expired', () => {
    const hold = createHold({
      id: 'h1',
      offeringId: 'o1',
      slots: [],
      heldBy: 'user-1',
      ttl: { minutes: 10 },
      now: new Date('2026-03-01T12:00:00Z'),
    });

    expect(isHoldExpired(hold, new Date('2026-03-01T12:11:00Z'))).toBe(true);
  });

  it('returns true at exact expiry time', () => {
    const hold = createHold({
      id: 'h1',
      offeringId: 'o1',
      slots: [],
      heldBy: 'user-1',
      ttl: { minutes: 10 },
      now: new Date('2026-03-01T12:00:00Z'),
    });

    expect(isHoldExpired(hold, new Date('2026-03-01T12:10:00Z'))).toBe(true);
  });
});
