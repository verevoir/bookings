// Types
export type {
  Duration,
  Calendar,
  TimeRange,
  DateRange,
  AvailabilityRule,
  Slot,
  SlotReference,
  CalendarMapping,
  Offering,
  Hold,
  Booking,
  CompositeAvailability,
} from './types.js';

// Calendar
export { defineCalendar, durationMs } from './calendar.js';

// Rules
export { defineRule, expandRule } from './rules.js';

// Availability
export {
  computeAvailability,
  findContiguousSlots,
  computeCompositeAvailability,
} from './availability.js';

// Offerings
export { defineOffering } from './offering.js';

// Holds
export { createHold, extendHold, isHoldExpired } from './hold.js';

// Bookings
export { holdToBooking } from './booking.js';
