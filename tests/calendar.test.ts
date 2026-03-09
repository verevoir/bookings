import { describe, it, expect } from 'vitest';
import { defineCalendar, durationMs } from '../src/calendar.js';

describe('durationMs', () => {
  it('converts minutes to milliseconds', () => {
    expect(durationMs({ minutes: 15 })).toBe(15 * 60 * 1000);
  });

  it('converts hours to milliseconds', () => {
    expect(durationMs({ hours: 2 })).toBe(2 * 60 * 60 * 1000);
  });

  it('converts days to milliseconds', () => {
    expect(durationMs({ days: 1 })).toBe(24 * 60 * 60 * 1000);
  });

  it('throws if no duration field set', () => {
    expect(() => durationMs({})).toThrow('Duration must specify');
  });
});

describe('defineCalendar', () => {
  it('creates a calendar with valid config', () => {
    const cal = defineCalendar({
      id: 'tables',
      slotDuration: { minutes: 15 },
      defaultCapacity: 10,
    });
    expect(cal.id).toBe('tables');
    expect(cal.slotDuration).toEqual({ minutes: 15 });
    expect(cal.defaultCapacity).toBe(10);
  });

  it('throws if capacity is less than 1', () => {
    expect(() =>
      defineCalendar({
        id: 'bad',
        slotDuration: { minutes: 15 },
        defaultCapacity: 0,
      }),
    ).toThrow('defaultCapacity must be at least 1');
  });
});
