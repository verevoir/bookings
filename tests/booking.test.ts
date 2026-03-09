import { describe, it, expect } from 'vitest';
import { createHold } from '../src/hold.js';
import { holdToBooking } from '../src/booking.js';

describe('holdToBooking', () => {
  it('converts a hold to a booking', () => {
    const hold = createHold({
      id: 'h1',
      offeringId: 'dinner',
      slots: [
        {
          calendarId: 'tables',
          start: new Date('2026-03-01T19:00:00'),
          end: new Date('2026-03-01T20:30:00'),
          count: 1,
        },
      ],
      heldBy: 'user-1',
      ttl: { minutes: 10 },
    });

    const now = new Date('2026-03-01T12:05:00Z');
    const booking = holdToBooking(hold, {
      id: 'bk1',
      orderId: 'order-123',
      now,
    });

    expect(booking.id).toBe('bk1');
    expect(booking.offeringId).toBe('dinner');
    expect(booking.slots).toEqual(hold.slots);
    expect(booking.bookedBy).toBe('user-1');
    expect(booking.bookedAt).toEqual(now);
    expect(booking.orderId).toBe('order-123');
  });

  it('works without orderId', () => {
    const hold = createHold({
      id: 'h1',
      offeringId: 'skatepark',
      slots: [],
      heldBy: 'user-2',
      ttl: { minutes: 5 },
    });

    const booking = holdToBooking(hold, { id: 'bk2' });
    expect(booking.orderId).toBeUndefined();
  });
});
