import { expect, test } from 'bun:test';
import { ago } from './format';

test('ago counts calendar days in Amsterdam, not 24-hour spans', () => {
  // 23:30 one night, 08:00 the next morning: under nine hours, but yesterday.
  expect(ago('2026-03-10T23:30:00+01:00', '2026-03-11T08:00:00+01:00')).toBe('yesterday');
  // 00:30 the same day, read at 23:00: almost a full day, still today.
  expect(ago('2026-03-11T00:30:00+01:00', '2026-03-11T23:00:00+01:00')).toBe('today');
  // UTC says the 10th, Amsterdam says the 11th.
  expect(ago('2026-03-10T23:30:00Z', '2026-03-11T20:00:00+01:00')).toBe('today');
  // Across the clocks going forward.
  expect(ago('2026-03-28T20:00:00+01:00', '2026-03-30T09:00:00+02:00')).toBe('2 days ago');
});
