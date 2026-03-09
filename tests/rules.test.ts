import { describe, it, expect } from 'vitest';
import { defineRule, expandRule } from '../src/rules.js';
import { defineCalendar } from '../src/calendar.js';

describe('defineRule', () => {
  it('creates a rule', () => {
    const rule = defineRule({
      calendarId: 'tables',
      rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      timeRange: { start: '17:00', end: '23:00' },
    });
    expect(rule.calendarId).toBe('tables');
    expect(rule.rrule).toBe('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
    expect(rule.timeRange).toEqual({ start: '17:00', end: '23:00' });
    expect(rule.capacity).toBeUndefined();
  });

  it('accepts optional capacity override', () => {
    const rule = defineRule({
      calendarId: 'tables',
      rrule: 'FREQ=DAILY',
      timeRange: { start: '09:00', end: '17:00' },
      capacity: 5,
    });
    expect(rule.capacity).toBe(5);
  });
});

describe('expandRule', () => {
  const tables = defineCalendar({
    id: 'tables',
    slotDuration: { minutes: 30 },
    defaultCapacity: 10,
  });

  it('expands a daily rule into slots', () => {
    const rule = defineRule({
      calendarId: 'tables',
      rrule: 'FREQ=DAILY;COUNT=2',
      timeRange: { start: '10:00', end: '12:00' },
    });

    // 2 days, 10:00-12:00, 30-min slots = 4 slots per day = 8 total
    const slots = expandRule(rule, tables, {
      start: new Date('2026-01-01'),
      end: new Date('2026-12-31'),
    });

    expect(slots.length).toBe(8);
    expect(slots[0].capacity).toBe(10);
    expect(slots[0].used).toBe(0);
    expect(slots[0].available).toBe(10);
  });

  it('uses capacity override when specified', () => {
    const rule = defineRule({
      calendarId: 'tables',
      rrule: 'FREQ=DAILY;COUNT=1',
      timeRange: { start: '10:00', end: '10:30' },
      capacity: 5,
    });

    const slots = expandRule(rule, tables, {
      start: new Date('2026-01-01'),
      end: new Date('2026-12-31'),
    });

    expect(slots.length).toBe(1);
    expect(slots[0].capacity).toBe(5);
  });

  it('does not generate partial slots at end of time range', () => {
    const rule = defineRule({
      calendarId: 'tables',
      rrule: 'FREQ=DAILY;COUNT=1',
      timeRange: { start: '10:00', end: '10:45' },
    });

    // 30-min slots, 45-min window → only 1 slot (10:00-10:30)
    const slots = expandRule(rule, tables, {
      start: new Date('2026-01-01'),
      end: new Date('2026-12-31'),
    });

    expect(slots.length).toBe(1);
    expect(slots[0].start.getHours()).toBe(10);
    expect(slots[0].start.getMinutes()).toBe(0);
  });
});
