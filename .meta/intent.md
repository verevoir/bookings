# Intent — Verevoir Bookings

## Purpose

Provide time-based availability as pure computation — calendars, availability rules, offerings, holds, and bookings. Availability is computed from rules minus demand; empty slots are never stored. The library handles the domain logic; a reference service handles concurrency and persistence.

## Goals

- Compute availability from rules, not by creating and managing empty slot records
- Support wildly different booking domains: hotels, restaurants, skate parks, conferences, theme parks
- Handle contiguous slot grouping (restaurant: 90 min = 6 × 15 min) and composite availability (theme park: entrance + parking + disability pass)
- Provide hold-on-selection fairness with TTL-based expiry
- Stay pure — no I/O, no persistence, no concurrency in the library
- One external dependency (`rrule`) for iCal recurrence expansion

## Non-goals

- Be a booking service — the library is pure computation, the service is consumer-provided
- Handle payment processing — the consumer wires bookings to commerce
- Manage concurrency — the reference service uses PostgreSQL `FOR UPDATE SKIP LOCKED`
- Provide a calendar UI — that's a separate concern (`@verevoir/calendar`, future)
- Handle inventory without time — bookings is specifically time-based availability
- Restaurant-style ordering — deliberately deferred

## Key design decisions

- **Computed availability.** Rules define when capacity exists. Bookings and holds subtract from it. This is cheap to define, trivial to change, and eliminates correction algorithms.
- **RRULE for recurrence.** The iCal standard is expressive enough for all real-world patterns. The `rrule` library is well-maintained (700K+ weekly downloads) and handles expansion.
- **Capacity is per-calendar, not per-offering.** A calendar has a slot duration and capacity. An offering maps to one or more calendars. This keeps the model simple and composable.
- **Contiguous and composite are distinct query patterns.** Contiguous = N consecutive slots on one calendar. Composite = slots across N calendars where all must have capacity. Both are pure computation over the same underlying slot data.
- **Holds are the fairness mechanism.** Activity-based TTL extension (10 minutes from last interaction). The library defines hold semantics; the service enforces them concurrently.
- **Standalone.** No Verevoir package dependencies. The consumer wires bookings to commerce via the optional `orderId` field on confirmed bookings.

## Constraints

- Must build, test, and lint via `make build`, `make test`, `make lint`
- One runtime dependency: `rrule`
- All functions must be pure — no side effects, no I/O
- TypeScript, ESM + CJS dual output via tsup
