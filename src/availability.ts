import type {
  AvailabilityRule,
  Booking,
  Calendar,
  CompositeAvailability,
  DateRange,
  Hold,
  Offering,
  Slot,
} from './types.js';
import { expandRule } from './rules.js';

/**
 * Compute available slots for a calendar in a date range.
 * Expands rules into slots, then subtracts capacity consumed by bookings and active holds.
 */
export function computeAvailability(
  calendar: Calendar,
  rules: AvailabilityRule[],
  dateRange: DateRange,
  bookings: readonly Booking[],
  holds: readonly Hold[],
  now?: Date,
): Slot[] {
  const currentTime = now ?? new Date();

  // Expand rules into raw slots
  const calendarRules = rules.filter((r) => r.calendarId === calendar.id);
  const rawSlots: Slot[] = [];
  for (const rule of calendarRules) {
    rawSlots.push(...expandRule(rule, calendar, dateRange));
  }

  // Deduplicate slots by start time (multiple rules may generate overlapping slots)
  // Take the highest capacity when rules overlap
  const slotMap = new Map<number, Slot>();
  for (const slot of rawSlots) {
    const key = slot.start.getTime();
    const existing = slotMap.get(key);
    if (!existing || slot.capacity > existing.capacity) {
      slotMap.set(key, slot);
    }
  }

  // Build usage map: slot start time → total consumed
  const usageMap = new Map<number, number>();

  // Subtract bookings
  for (const booking of bookings) {
    for (const ref of booking.slots) {
      if (ref.calendarId !== calendar.id) continue;
      const key = ref.start.getTime();
      usageMap.set(key, (usageMap.get(key) ?? 0) + ref.count);
    }
  }

  // Subtract active holds
  for (const hold of holds) {
    if (hold.expiresAt <= currentTime) continue;
    for (const ref of hold.slots) {
      if (ref.calendarId !== calendar.id) continue;
      const key = ref.start.getTime();
      usageMap.set(key, (usageMap.get(key) ?? 0) + ref.count);
    }
  }

  // Apply usage to slots
  const result: Slot[] = [];
  const sortedKeys = Array.from(slotMap.keys()).sort((a, b) => a - b);

  for (const key of sortedKeys) {
    const slot = slotMap.get(key)!;
    const used = usageMap.get(key) ?? 0;
    result.push({
      ...slot,
      used,
      available: Math.max(0, slot.capacity - used),
    });
  }

  return result;
}

/**
 * Find groups of N contiguous available slots on a single calendar.
 * Each group represents a valid booking window (e.g., 6 × 15-min = 90 minutes).
 * Only returns groups where every slot has at least `minCapacity` available (default 1).
 */
export function findContiguousSlots(
  slots: Slot[],
  count: number,
  minCapacity: number = 1,
): Slot[][] {
  if (count <= 0) return [];
  if (slots.length < count) return [];

  const groups: Slot[][] = [];

  for (let i = 0; i <= slots.length - count; i++) {
    const group = slots.slice(i, i + count);

    // Check all slots have sufficient capacity
    const allAvailable = group.every((s) => s.available >= minCapacity);
    if (!allAvailable) continue;

    // Check slots are contiguous (each starts where the previous ends)
    let contiguous = true;
    for (let j = 1; j < group.length; j++) {
      if (group[j].start.getTime() !== group[j - 1].end.getTime()) {
        contiguous = false;
        break;
      }
    }
    if (!contiguous) continue;

    groups.push(group);
  }

  return groups;
}

/**
 * Compute composite availability across multiple calendars for an offering.
 * Returns dates where all required calendars have sufficient capacity.
 */
export function computeCompositeAvailability(
  calendars: readonly Calendar[],
  rules: readonly AvailabilityRule[],
  offering: Offering,
  dateRange: DateRange,
  bookings: readonly Booking[],
  holds: readonly Hold[],
  now?: Date,
): CompositeAvailability[] {
  const calendarMap = new Map(calendars.map((c) => [c.id, c]));

  // Compute availability per calendar
  const availByCalendar = new Map<string, Slot[]>();
  for (const mapping of offering.mappings) {
    const calendar = calendarMap.get(mapping.calendarId);
    if (!calendar) {
      throw new Error(`Calendar not found: ${mapping.calendarId}`);
    }
    const slots = computeAvailability(
      calendar,
      rules as AvailabilityRule[],
      dateRange,
      bookings,
      holds,
      now,
    );

    if (mapping.contiguous) {
      // For contiguous mappings, filter to only slots that have contiguous groups
      const groups = findContiguousSlots(slots, mapping.slotCount);
      // Use the first slot of each group as the available time
      availByCalendar.set(
        mapping.calendarId,
        groups.map((g) => g[0]),
      );
    } else {
      // For non-contiguous, filter slots with enough capacity
      availByCalendar.set(
        mapping.calendarId,
        slots.filter((s) => s.available >= mapping.slotCount),
      );
    }
  }

  // Group by date and find dates where all calendars have availability
  const dateMap = new Map<string, Map<string, number>>();

  for (const [calendarId, slots] of availByCalendar) {
    for (const slot of slots) {
      const dateKey = slot.start.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Map());
      }
      const calMap = dateMap.get(dateKey)!;
      calMap.set(
        calendarId,
        Math.max(calMap.get(calendarId) ?? 0, slot.available),
      );
    }
  }

  // Filter to dates where all required calendars are present
  const requiredCalendars = offering.mappings.map((m) => m.calendarId);
  const results: CompositeAvailability[] = [];

  for (const [dateKey, calMap] of dateMap) {
    if (requiredCalendars.every((id) => calMap.has(id))) {
      results.push({
        date: new Date(dateKey),
        availableByCalendar: calMap,
      });
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}
