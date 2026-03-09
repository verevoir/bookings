import type { Booking, Hold } from './types.js';

/** Convert a hold to a confirmed booking. */
export function holdToBooking(
  hold: Hold,
  config: {
    id: string;
    orderId?: string;
    now?: Date;
  },
): Booking {
  return {
    id: config.id,
    offeringId: hold.offeringId,
    slots: hold.slots,
    bookedBy: hold.heldBy,
    bookedAt: config.now ?? new Date(),
    orderId: config.orderId,
  };
}
