import type { Calendar, Duration } from './types.js';

/** Convert a Duration to milliseconds. */
export function durationMs(d: Duration): number {
  if (d.minutes != null) return d.minutes * 60 * 1000;
  if (d.hours != null) return d.hours * 60 * 60 * 1000;
  if (d.days != null) return d.days * 24 * 60 * 60 * 1000;
  throw new Error('Duration must specify minutes, hours, or days');
}

/** Create a calendar definition. */
export function defineCalendar(config: {
  id: string;
  slotDuration: Duration;
  defaultCapacity: number;
}): Calendar {
  if (config.defaultCapacity < 1) {
    throw new Error('defaultCapacity must be at least 1');
  }
  if (durationMs(config.slotDuration) <= 0) {
    throw new Error('slotDuration must be positive');
  }
  return {
    id: config.id,
    slotDuration: config.slotDuration,
    defaultCapacity: config.defaultCapacity,
  };
}
