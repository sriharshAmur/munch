import { expect, test } from 'bun:test';
import { generateDemo } from '../../demo/generate';
import { overview } from './overview';
import { recap, storyPeriods } from './recap';
import { sum } from './shared';

const demo = generateDemo().orders;
const o = overview(demo);

test('the overview adds up to the orders it was given', () => {
  expect(sum(o.hours)).toBe(o.count);
  expect(sum(o.days)).toBe(o.count);
  expect(sum(o.weeks.map((w) => w.count))).toBe(o.count);
  expect(sum(o.cost.bins.map((b) => b.count))).toBe(o.count);
  expect(sum(o.homes.map((h) => h.count))).toBe(o.count);
  for (const w of o.weeks) expect(sum(w.homes.map((h) => h.count))).toBe(w.count);
});

test('a year of orders comes out as about 52 weeks, Monday first, oldest first', () => {
  expect(o.weeks.length).toBeGreaterThan(50);
  expect(o.weeks.length).toBeLessThan(55);
  expect(new Date(`${o.weeks[0]?.start}T00:00:00Z`).getUTCDay()).toBe(1);
  expect(o.weeks.map((w) => w.start)).toEqual([...o.weeks.map((w) => w.start)].sort());
  expect(o.busiestWeek?.count).toBe(Math.max(...o.weeks.map((w) => w.count)));
});

test('the busiest three hours are the evening, and the places are ranked', () => {
  expect(o.window.hour).toBeGreaterThanOrEqual(17);
  expect(o.window.hour).toBeLessThanOrEqual(20);
  expect(o.places[0]?.count).toBeGreaterThanOrEqual(o.places[1]?.count ?? 0);
  expect(o.cost.feeShare).toBeGreaterThan(0);
  expect(o.cost.feeShare).toBeLessThan(0.3);
  expect(overview([]).count).toBe(0);
});

test('stories cover the whole history and each month with a few orders, newest first', () => {
  const periods = storyPeriods(demo);
  expect(periods.length).toBeGreaterThan(8);
  expect(periods[0]).toBe('2026-10');
  expect(periods).toEqual([...periods].sort().reverse());
  const all = recap(demo, 'all');
  expect(all?.count).toBe(o.count);
  expect(all?.buckets.length).toBe(12);
  const month = recap(demo, '2026-10');
  expect(month?.buckets.map((b) => b.short)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  expect(month?.previousLabel).toBe('September');
  expect(sum(month?.buckets.map((b) => b.count) ?? [])).toBe(month?.count ?? -1);
});
