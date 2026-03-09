import { describe, it, expect } from 'vitest';
import { defineCalendar } from '../src/calendar.js';
import { defineRule } from '../src/rules.js';
import { defineOffering } from '../src/offering.js';
import {
  computeAvailability,
  findContiguousSlots,
  computeCompositeAvailability,
} from '../src/availability.js';
import type { Booking, Hold } from '../src/types.js';

const tables = defineCalendar({
  id: 'tables',
  slotDuration: { minutes: 30 },
  defaultCapacity: 10,
});

const dailyRule = defineRule({
  calendarId: 'tables',
  rrule: 'FREQ=DAILY;COUNT=1',
  timeRange: { start: '10:00', end: '12:00' },
});

const dateRange = {
  start: new Date('2026-01-01'),
  end: new Date('2026-12-31'),
};

describe('computeAvailability', () => {
  it('returns full capacity when no bookings or holds', () => {
    const slots = computeAvailability(tables, [dailyRule], dateRange, [], []);

    expect(slots.length).toBe(4); // 10:00-12:00, 30-min = 4 slots
    expect(slots[0].capacity).toBe(10);
    expect(slots[0].used).toBe(0);
    expect(slots[0].available).toBe(10);
  });

  it('subtracts bookings from capacity', () => {
    const booking: Booking = {
      id: 'b1',
      offeringId: 'o1',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-01-01T10:00:00'),
          end: new Date('2026-01-01T10:30:00'),
          count: 3,
        },
      ],
      bookedBy: 'user-1',
      bookedAt: new Date(),
    };

    const slots = computeAvailability(
      tables,
      [dailyRule],
      dateRange,
      [booking],
      [],
    );

    expect(slots[0].used).toBe(3);
    expect(slots[0].available).toBe(7);
    expect(slots[1].used).toBe(0);
    expect(slots[1].available).toBe(10);
  });

  it('subtracts active holds from capacity', () => {
    const future = new Date(Date.now() + 600_000); // 10 min from now
    const hold: Hold = {
      id: 'h1',
      offeringId: 'o1',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-01-01T10:30:00'),
          end: new Date('2026-01-01T11:00:00'),
          count: 2,
        },
      ],
      heldBy: 'user-2',
      heldAt: new Date(),
      expiresAt: future,
    };

    const slots = computeAvailability(
      tables,
      [dailyRule],
      dateRange,
      [],
      [hold],
    );

    expect(slots[0].available).toBe(10); // first slot unaffected
    expect(slots[1].used).toBe(2);
    expect(slots[1].available).toBe(8);
  });

  it('ignores expired holds', () => {
    const past = new Date(Date.now() - 1000); // expired
    const hold: Hold = {
      id: 'h1',
      offeringId: 'o1',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-01-01T10:00:00'),
          end: new Date('2026-01-01T10:30:00'),
          count: 5,
        },
      ],
      heldBy: 'user-2',
      heldAt: new Date(),
      expiresAt: past,
    };

    const slots = computeAvailability(
      tables,
      [dailyRule],
      dateRange,
      [],
      [hold],
    );

    expect(slots[0].available).toBe(10);
  });

  it('floors available at zero when overbooked', () => {
    const booking: Booking = {
      id: 'b1',
      offeringId: 'o1',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-01-01T10:00:00'),
          end: new Date('2026-01-01T10:30:00'),
          count: 15,
        },
      ],
      bookedBy: 'user-1',
      bookedAt: new Date(),
    };

    const slots = computeAvailability(
      tables,
      [dailyRule],
      dateRange,
      [booking],
      [],
    );

    expect(slots[0].used).toBe(15);
    expect(slots[0].available).toBe(0);
  });
});

describe('findContiguousSlots', () => {
  it('finds groups of N contiguous available slots', () => {
    const slots = computeAvailability(tables, [dailyRule], dateRange, [], []);

    // 4 slots total, looking for groups of 3
    const groups = findContiguousSlots(slots, 3);
    expect(groups.length).toBe(2); // [0,1,2] and [1,2,3]
  });

  it('returns empty if not enough slots', () => {
    const slots = computeAvailability(tables, [dailyRule], dateRange, [], []);
    const groups = findContiguousSlots(slots, 5);
    expect(groups.length).toBe(0);
  });

  it('skips groups where a slot has insufficient capacity', () => {
    const booking: Booking = {
      id: 'b1',
      offeringId: 'o1',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-01-01T10:30:00'),
          end: new Date('2026-01-01T11:00:00'),
          count: 10, // fully booked
        },
      ],
      bookedBy: 'user-1',
      bookedAt: new Date(),
    };

    const slots = computeAvailability(
      tables,
      [dailyRule],
      dateRange,
      [booking],
      [],
    );
    const groups = findContiguousSlots(slots, 3);

    // slot[1] has 0 available, so no group of 3 can include it
    expect(groups.length).toBe(0);
  });
});

describe('computeCompositeAvailability', () => {
  it('finds dates where all calendars have capacity', () => {
    const entrance = defineCalendar({
      id: 'entrance',
      slotDuration: { days: 1 },
      defaultCapacity: 5000,
    });
    const parking = defineCalendar({
      id: 'parking',
      slotDuration: { days: 1 },
      defaultCapacity: 200,
    });

    const entranceRule = defineRule({
      calendarId: 'entrance',
      rrule: 'FREQ=DAILY;COUNT=3',
      timeRange: { start: '00:00', end: '24:00' },
    });
    const parkingRule = defineRule({
      calendarId: 'parking',
      rrule: 'FREQ=DAILY;COUNT=3',
      timeRange: { start: '00:00', end: '24:00' },
    });

    const familyVisit = defineOffering({
      id: 'family',
      label: 'Family Visit',
      mappings: [
        { calendarId: 'entrance', slotCount: 3 },
        { calendarId: 'parking', slotCount: 1 },
      ],
    });

    const range = {
      start: new Date('2026-01-01'),
      end: new Date('2026-12-31'),
    };

    const composite = computeCompositeAvailability(
      [entrance, parking],
      [entranceRule, parkingRule],
      familyVisit,
      range,
      [],
      [],
    );

    expect(composite.length).toBe(3);
  });

  it('excludes dates where one calendar is full', () => {
    const entrance = defineCalendar({
      id: 'entrance',
      slotDuration: { days: 1 },
      defaultCapacity: 100,
    });
    const parking = defineCalendar({
      id: 'parking',
      slotDuration: { days: 1 },
      defaultCapacity: 1,
    });

    const entranceRule = defineRule({
      calendarId: 'entrance',
      rrule: 'FREQ=DAILY;COUNT=2',
      timeRange: { start: '00:00', end: '24:00' },
    });
    const parkingRule = defineRule({
      calendarId: 'parking',
      rrule: 'FREQ=DAILY;COUNT=2',
      timeRange: { start: '00:00', end: '24:00' },
    });

    // Book the only parking slot on day 1
    const booking: Booking = {
      id: 'b1',
      offeringId: 'o1',
      slots: [
        {
          calendarId: 'parking',
          start: new Date('2026-01-01T00:00:00'),
          end: new Date('2026-01-02T00:00:00'),
          count: 1,
        },
      ],
      bookedBy: 'user-1',
      bookedAt: new Date(),
    };

    const visit = defineOffering({
      id: 'visit',
      label: 'Visit',
      mappings: [
        { calendarId: 'entrance', slotCount: 1 },
        { calendarId: 'parking', slotCount: 1 },
      ],
    });

    const range = {
      start: new Date('2026-01-01'),
      end: new Date('2026-12-31'),
    };

    const composite = computeCompositeAvailability(
      [entrance, parking],
      [entranceRule, parkingRule],
      visit,
      range,
      [booking],
      [],
    );

    // Day 1 parking is full, so only day 2 is available
    expect(composite.length).toBe(1);
  });
});
