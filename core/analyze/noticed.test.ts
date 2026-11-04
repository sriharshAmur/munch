import { expect, test } from 'bun:test';
import { generateDemo, DEMO_NOW } from '../../demo/generate';
import type { Order } from '../schema';
import { noticed, type FindingKind } from './noticed';
import { persona } from './persona';
import { recap } from './recap';
import { surge } from './timeline';

const demo = generateDemo().orders;
const base = demo[0];
if (!base) throw Error('Demo fixture is empty');
const fake = (
  id: string,
  placedAt: string,
  overrides: Partial<Order> = {},
): Order => ({
  ...base,
  id: `demo:${id}`,
  placedAt,
  deliveredAt: null,
  status: 'delivered',
  home: { key: 'h', postcode: '0000', city: 'Nowhere' },
  restaurant: { id: 'a', name: 'Imaginary Spoon', cuisines: ['Thai'] },
  items: [{ name: 'Noodles', quantity: 1, unitPrice: 1000, total: 1000, options: [] }],
  money: {
    items: 1000,
    deliveryFee: 100,
    serviceFee: 0,
    smallOrderFee: 0,
    tip: 0,
    discount: 0,
    adjustments: 0,
    total: 1100,
    currency: 'EUR',
  },
  group: { isGroup: false, groupSize: null },
  ...overrides,
});
const kinds = (orders: Order[], now = DEMO_NOW) =>
  new Set<FindingKind>(noticed(orders, now).map((f) => f.kind));

test('the demo person has the habits worth pointing out', () => {
  const found = noticed(demo, DEMO_NOW);
  const of = <K extends FindingKind>(kind: K) =>
    found.find((f): f is Extract<typeof f, { kind: K }> => f.kind === kind);
  expect(of('ghosted')?.restaurant).toBe('Fennel Fold');
  expect(of('ritual')?.count).toBeGreaterThanOrEqual(5);
  expect(of('moving-in')?.moves.map((m) => m.city)).toEqual(['Amsterdam']);
  expect(of('inflation')?.change).toBeGreaterThan(0.05);
  expect(of('one-timers')?.count).toBeGreaterThan(4);
  expect(of('payday')?.ratio).toBeGreaterThan(1.15);
  expect(of('delivery-time')?.median).toBeGreaterThan(20);
});

test('a short, varied history only gets the findings it can support', () => {
  const orders = Array.from({ length: 8 }, (_, i) =>
    fake(String(i), `2025-0${1 + (i % 8)}-1${i}T19:30:00+01:00`, {
      restaurant: { id: `r${i}`, name: `Place ${i}`, cuisines: ['Thai'] },
    }),
  );
  const found = kinds(orders);
  expect(found.has('one-timers')).toBe(true);
  expect(found.has('ghosted')).toBe(false);
  expect(found.has('ritual')).toBe(false);
  expect(found.has('payday')).toBe(false);
  expect(noticed(orders.slice(0, 3), DEMO_NOW)).toEqual([]);
});

test('a place you stopped ordering from only counts as ghosted if you still live nearby', () => {
  const regular = Array.from({ length: 6 }, (_, i) =>
    fake(`g${i}`, `2024-01-${10 + i * 2}T19:00:00+01:00`),
  );
  const elsewhere = { key: 'other', postcode: '1111', city: 'Elsewhere' };
  const stayed = [...regular, fake('later', '2025-06-01T19:00:00+02:00', {
    restaurant: { id: 'b', name: 'Other', cuisines: ['Thai'] },
  })];
  const moved = [...regular, fake('later', '2025-06-01T19:00:00+02:00', {
    restaurant: { id: 'b', name: 'Other', cuisines: ['Thai'] },
    home: elsewhere,
  })];
  expect(kinds(stayed).has('ghosted')).toBe(true);
  expect(kinds(moved).has('ghosted')).toBe(false);
});

test('the order type follows the strongest habit', () => {
  const explorer = Array.from({ length: 12 }, (_, i) =>
    fake(`e${i}`, `2025-02-${10 + i}T19:00:00+01:00`, {
      restaurant: { id: `x${i}`, name: `X${i}`, cuisines: ['Thai'] },
    }),
  );
  expect(persona(explorer)?.type).toBe('explorer');
  const owl = Array.from({ length: 12 }, (_, i) =>
    fake(`n${i}`, `2025-02-${10 + i}T23:4${i % 10}:00+01:00`),
  );
  expect(persona(owl)?.type).toBe('night');
  expect(persona(owl.slice(0, 5))).toBeNull();
});

test('a year recap counts new places against everything before it', () => {
  const r = recap(demo, 2026);
  expect(r?.count).toBeGreaterThan(50);
  expect(r?.newPlaces).toBeGreaterThan(3);
  expect(r?.places[0]?.count).toBeGreaterThan(5);
  expect(recap(demo, 2010)).toBeNull();
});

test('a surge needs a run of clearly busier months', () => {
  const months = Array.from({ length: 24 }, (_, i) => ({
    month: `2020-${String(i).padStart(2, '0')}`,
    count: i >= 8 && i < 13 ? 20 : 10,
  }));
  expect(surge(months)).toMatchObject({ start: '2020-08', end: '2020-12' });
  expect(surge(months.map((m) => ({ ...m, count: 10 })))).toBeNull();
});
