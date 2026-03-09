import { describe, it, expect } from 'vitest';
import { defineOffering } from '../src/offering.js';

describe('defineOffering', () => {
  it('creates an offering with mappings', () => {
    const offering = defineOffering({
      id: 'dinner',
      label: 'Dinner Reservation',
      mappings: [{ calendarId: 'tables', slotCount: 6, contiguous: true }],
    });

    expect(offering.id).toBe('dinner');
    expect(offering.label).toBe('Dinner Reservation');
    expect(offering.mappings.length).toBe(1);
    expect(offering.mappings[0].contiguous).toBe(true);
  });

  it('supports composite mappings', () => {
    const offering = defineOffering({
      id: 'family-visit',
      label: 'Family Day Out',
      mappings: [
        { calendarId: 'entrance', slotCount: 3 },
        { calendarId: 'parking', slotCount: 1 },
        { calendarId: 'disability', slotCount: 1 },
      ],
    });

    expect(offering.mappings.length).toBe(3);
  });

  it('throws if no mappings provided', () => {
    expect(() =>
      defineOffering({ id: 'bad', label: 'Bad', mappings: [] }),
    ).toThrow('at least one calendar mapping');
  });
});
