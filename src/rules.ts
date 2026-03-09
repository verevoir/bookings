import { RRule } from 'rrule';
import type { AvailabilityRule, Calendar, DateRange, Slot } from './types.js';
import { durationMs } from './calendar.js';

/** Create an availability rule. */
export function defineRule(config: {
  calendarId: string;
  rrule: string;
  timeRange: { start: string; end: string };
  capacity?: number;
}): AvailabilityRule {
  return {
    calendarId: config.calendarId,
    rrule: config.rrule,
    timeRange: config.timeRange,
    capacity: config.capacity,
  };
}

/** Parse a HH:MM string to hours and minutes. */
function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

/**
 * Expand an availability rule into concrete slots for a date range.
 * Uses the rrule library to expand recurrence, then generates slots
 * within each date's time range at the calendar's slot duration.
 */
export function expandRule(
  rule: AvailabilityRule,
  calendar: Calendar,
  dateRange: DateRange,
): Slot[] {
  // Parse the RRULE and set dtstart to the date range start if not specified
  const parsed = RRule.parseString(rule.rrule);
  if (!parsed.dtstart) {
    parsed.dtstart = dateRange.start;
  }
  const rrule = new RRule(parsed);
  const dates = rrule.between(dateRange.start, dateRange.end, true);

  const slotMs = durationMs(calendar.slotDuration);
  const capacity = rule.capacity ?? calendar.defaultCapacity;
  const startTime = parseTime(rule.timeRange.start);
  const endTime = parseTime(rule.timeRange.end);
  const slots: Slot[] = [];

  for (const date of dates) {
    const dayStart = new Date(date);
    dayStart.setHours(startTime.hours, startTime.minutes, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

    let slotStart = dayStart.getTime();
    const endMs = dayEnd.getTime();

    while (slotStart < endMs) {
      const slotEnd = slotStart + slotMs;
      if (slotEnd > endMs) break;

      slots.push({
        calendarId: calendar.id,
        start: new Date(slotStart),
        end: new Date(slotEnd),
        capacity,
        used: 0,
        available: capacity,
      });

      slotStart = slotEnd;
    }
  }

  return slots;
}
