# @verevoir/bookings — Time-Based Availability

Computed availability for bookings — calendars, rules, offerings, holds, and confirmed bookings. Availability is derived from rules minus demand; empty slots are never stored.

## What It Does

- **Calendar** — bookable resource with slot duration (15 min, 1 day, etc.) and default capacity
- **Availability Rules** — RRULE recurrence patterns defining when capacity exists, with time ranges and optional capacity overrides
- **Offering** — customer-facing bookable item that maps to calendar slots (contiguous or composite)
- **Availability Engine** — computes available slots: rules(range) - bookings - holds. Contiguous and composite queries.
- **Hold** — temporary reservation with TTL, extended on activity, expires automatically
- **Booking** — confirmed reservation from a hold, optional link to commerce order

## Design Principles

- **Computed, not stored.** Availability = rules minus bookings minus holds. No empty slot records.
- **Pure computation.** No I/O, no persistence, no concurrency. The reference service handles those.
- **Capacity is per-calendar.** Offerings determine how to consume capacity across calendars.
- **RRULE for recurrence.** Standard iCal format, expanded via the `rrule` library.
- **Holds are the fairness mechanism.** Hold-on-selection with activity-based TTL extension.
- **Standalone.** No Verevoir dependencies. Consumer wires to commerce via optional `orderId`.

## Quick Example

```typescript
import {
  defineCalendar,
  defineRule,
  defineOffering,
  computeAvailability,
  findContiguousSlots,
  createHold,
  holdToBooking,
} from '@verevoir/bookings';

// Restaurant with 10 tables, 15-minute slot granularity
const tables = defineCalendar({
  id: 'tables',
  slotDuration: { minutes: 15 },
  defaultCapacity: 10,
});

// Open weekday evenings
const weekdayEvening = defineRule({
  calendarId: 'tables',
  rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  timeRange: { start: '17:00', end: '23:00' },
});

// 90-minute dinner = 6 contiguous 15-min slots
const dinner = defineOffering({
  id: 'dinner',
  label: 'Dinner Reservation',
  mappings: [{ calendarId: 'tables', slotCount: 6, contiguous: true }],
});

// Compute available slots for a date range
const slots = computeAvailability(
  tables,
  [weekdayEvening],
  { start: new Date('2026-04-01'), end: new Date('2026-04-02') },
  existingBookings,
  activeHolds,
);

// Find groups of 6 contiguous available slots
const groups = findContiguousSlots(slots, 6);
// Each group is a valid 90-minute booking window
```

## Setup

```bash
npm install
```

## Commands

```bash
make build   # Compile TypeScript
make test    # Run test suite
make lint    # Lint and check formatting
make run     # No-op (library)
```

## Architecture

- `src/types.ts` — Core interfaces: Calendar, Duration, AvailabilityRule, TimeRange, Offering, CalendarMapping, Slot, Hold, SlotReference, Booking
- `src/calendar.ts` — Calendar definition, slot duration conversion
- `src/rules.ts` — Availability rule definition, RRULE expansion into concrete slots
- `src/availability.ts` — Availability computation, contiguous slot finding, composite availability queries
- `src/offering.ts` — Offering definition with calendar mappings
- `src/hold.ts` — Hold creation, TTL extension, expiry checking
- `src/booking.ts` — Convert holds to confirmed bookings
- `src/index.ts` — Public API exports

## Dependencies

- **One runtime dependency** — `rrule` for iCal recurrence expansion
- **No** dependency on any `@verevoir/*` package
- **No** persistence or I/O — the reference service handles those
