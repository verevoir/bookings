/** Time duration expressed as minutes, hours, or days. Exactly one field should be set. */
export interface Duration {
  readonly minutes?: number;
  readonly hours?: number;
  readonly days?: number;
}

/** A bookable resource with a slot granularity and default capacity per slot. */
export interface Calendar {
  readonly id: string;
  readonly slotDuration: Duration;
  readonly defaultCapacity: number;
}

/** Time range within a day, expressed as HH:MM strings. */
export interface TimeRange {
  readonly start: string;
  readonly end: string;
}

/** Date range for availability queries. */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/** Defines when a calendar has capacity. Uses RRULE for recurrence. */
export interface AvailabilityRule {
  readonly calendarId: string;
  readonly rrule: string;
  readonly timeRange: TimeRange;
  readonly capacity?: number;
}

/** A computed slot with capacity information. */
export interface Slot {
  readonly calendarId: string;
  readonly start: Date;
  readonly end: Date;
  readonly capacity: number;
  readonly used: number;
  readonly available: number;
}

/** Reference to a specific slot, used in holds and bookings. */
export interface SlotReference {
  readonly calendarId: string;
  readonly start: Date;
  readonly end: Date;
  readonly count: number;
}

/** Maps an offering to slots on a calendar. */
export interface CalendarMapping {
  readonly calendarId: string;
  readonly slotCount: number;
  readonly contiguous?: boolean;
}

/** A customer-facing bookable item that maps to one or more calendar slots. */
export interface Offering {
  readonly id: string;
  readonly label: string;
  readonly mappings: readonly CalendarMapping[];
}

/** A temporary reservation with TTL. */
export interface Hold {
  readonly id: string;
  readonly offeringId: string;
  readonly slots: readonly SlotReference[];
  readonly heldBy: string;
  readonly heldAt: Date;
  readonly expiresAt: Date;
}

/** A confirmed reservation created from a hold. */
export interface Booking {
  readonly id: string;
  readonly offeringId: string;
  readonly slots: readonly SlotReference[];
  readonly bookedBy: string;
  readonly bookedAt: Date;
  readonly orderId?: string;
}

/** Availability for a date across multiple calendars for an offering. */
export interface CompositeAvailability {
  readonly date: Date;
  readonly availableByCalendar: ReadonlyMap<string, number>;
}
