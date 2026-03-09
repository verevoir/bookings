import type { Duration, Hold, SlotReference } from './types.js';
import { durationMs } from './calendar.js';

/** Create a hold — a temporary reservation against specific slots. */
export function createHold(config: {
  id: string;
  offeringId: string;
  slots: SlotReference[];
  heldBy: string;
  ttl: Duration;
  now?: Date;
}): Hold {
  const heldAt = config.now ?? new Date();
  const ttlMs = durationMs(config.ttl);

  return {
    id: config.id,
    offeringId: config.offeringId,
    slots: config.slots,
    heldBy: config.heldBy,
    heldAt,
    expiresAt: new Date(heldAt.getTime() + ttlMs),
  };
}

/** Extend a hold's TTL from the current time. */
export function extendHold(hold: Hold, ttl: Duration, now?: Date): Hold {
  const currentTime = now ?? new Date();
  const ttlMs = durationMs(ttl);

  return {
    ...hold,
    expiresAt: new Date(currentTime.getTime() + ttlMs),
  };
}

/** Check if a hold has expired. */
export function isHoldExpired(hold: Hold, now?: Date): boolean {
  const currentTime = now ?? new Date();
  return hold.expiresAt <= currentTime;
}
