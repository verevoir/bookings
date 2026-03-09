# @verevoir/bookings

Time-based availability — calendars, rules, computed availability, offerings, holds, and confirmed bookings. Availability is derived from rules minus demand; empty slots are never stored.

## What It Does

- **Calendar** — a bookable resource with slot duration and default capacity per slot
- **Availability Rules** — RRULE recurrence patterns defining when capacity exists
- **Offering** — a customer-facing bookable item that maps to one or more calendar slots
- **Availability Engine** — computes available slots: `rules(range) - bookings - holds`
- **Contiguous Slots** — find groups of N consecutive available slots (restaurant-style bookings)
- **Composite Availability** — query across multiple calendars, return only dates where all have capacity
- **Hold** — temporary reservation with TTL, extended on activity, expires automatically
- **Booking** — confirmed reservation from a hold, optionally linked to a commerce order

## Install

```bash
npm install @verevoir/bookings
```

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

// Restaurant: 15-minute slots, 10 tables
const tables = defineCalendar({
  id: 'tables',
  slotDuration: { minutes: 15 },
  defaultCapacity: 10,
});

// Open weekday evenings
const evenings = defineRule({
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

// Query availability
const dateRange = { start: new Date('2026-04-07'), end: new Date('2026-04-08') };
const slots = computeAvailability(tables, [evenings], dateRange, [], []);

// Find valid 90-minute windows
const windows = findContiguousSlots(slots, 6);

// Hold the first available window for 10 minutes
const hold = createHold({
  id: 'hold-1',
  offeringId: 'dinner',
  slots: windows[0].map((s) => ({
    calendarId: s.calendarId,
    start: s.start,
    end: s.end,
    count: 1,
  })),
  heldBy: 'customer-1',
  ttl: { minutes: 10 },
});

// Confirm the booking
const booking = holdToBooking(hold, { id: 'booking-1' });
```

## API

### Calendar

| Export | Description |
| --- | --- |
| `defineCalendar({ id, slotDuration, defaultCapacity })` | Create a bookable resource |
| `durationMs(duration)` | Convert a Duration to milliseconds |

### Rules

| Export | Description |
| --- | --- |
| `defineRule({ calendarId, rrule, timeRange, capacity? })` | Create an availability rule |
| `expandRule(rule, calendar, dateRange)` | Expand a rule into concrete slots |

### Availability

| Export | Description |
| --- | --- |
| `computeAvailability(calendar, rules, dateRange, bookings, holds)` | Compute available slots |
| `findContiguousSlots(slots, count, minCapacity?)` | Find groups of N contiguous available slots |
| `computeCompositeAvailability(calendars, rules, offering, dateRange, bookings, holds)` | Cross-calendar availability |

### Offerings

| Export | Description |
| --- | --- |
| `defineOffering({ id, label, mappings })` | Define a customer-facing bookable item |

### Holds

| Export | Description |
| --- | --- |
| `createHold({ id, offeringId, slots, heldBy, ttl })` | Create a temporary reservation |
| `extendHold(hold, ttl)` | Reset TTL from current time |
| `isHoldExpired(hold)` | Check if a hold has expired |

### Bookings

| Export | Description |
| --- | --- |
| `holdToBooking(hold, { id, orderId? })` | Convert a hold to a confirmed booking |

## Architecture

| File | Responsibility |
| --- | --- |
| `src/types.ts` | Core interfaces: Calendar, Duration, AvailabilityRule, Slot, Offering, Hold, Booking |
| `src/calendar.ts` | Calendar definition and duration conversion |
| `src/rules.ts` | Rule definition and RRULE expansion into concrete slots |
| `src/availability.ts` | Availability computation, contiguous slots, composite queries |
| `src/offering.ts` | Offering definition with calendar mappings |
| `src/hold.ts` | Hold creation, TTL extension, expiry checking |
| `src/booking.ts` | Convert holds to confirmed bookings |
| `src/index.ts` | Public API exports |

## Design Decisions

- **Computed, not stored.** Availability = rules minus bookings minus holds. No empty slot records.
- **Pure computation.** No I/O, no persistence, no concurrency. The consumer (or a reference service) handles those.
- **RRULE for recurrence.** Standard iCal format, expanded via the `rrule` library.
- **Capacity is per-calendar.** Offerings determine how to consume capacity across calendars.
- **Holds are the fairness mechanism.** Hold on selection with activity-based TTL extension prevents race conditions during purchase.
- **Composite bookings.** Theme park pattern — query across entrance, parking, and disability pass calendars; only show dates where all are available.
- **Contiguous bookings.** Restaurant pattern — a 90-minute dinner is 6 × 15-minute slots; the customer sees "18:00", not the underlying granularity.
- **Standalone.** No Verevoir dependencies. Wire to `@verevoir/commerce` via the optional `orderId` field on bookings.

## Documentation

- [Bookings](https://verevoir.io/docs/bookings) — calendars, availability rules, offerings, holds, and confirmed bookings
- [Commerce](https://verevoir.io/docs/commerce) — products, baskets, orders, payments (wire to bookings via `orderId`)

## Development

```bash
npm install    # Install dependencies
make build     # Compile TypeScript
make test      # Run test suite
make lint      # Check formatting
```
