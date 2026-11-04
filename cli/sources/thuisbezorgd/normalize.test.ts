import { test, expect } from 'bun:test';
import { normalizeDetail } from './normalize';
import { fakeDetail as fake } from './fixture';

test('normalisation converts euros to cents and keeps only the coarse delivery area', () => {
  const o = normalizeDetail(fake);
  expect(o.money.total).toBe(2700);
  expect(o.items[0]?.total).toBe(2400);
  expect(o.placedAt).toBe('2026-03-01T23:30:00+01:00');
  expect(o.home).toEqual({ key: '1', postcode: '0001', city: 'Demo city' });
  expect(JSON.stringify(o)).not.toContain('Not retained');
  expect(JSON.stringify(o)).not.toContain('example.invalid');
});
test('a changed response reports field paths without values', () => {
  expect(() =>
    normalizeDetail({
      ...fake,
      restaurant: { id: 123, displayName: 'Secret pretend name' },
    }),
  ).toThrow('restaurant.id');
  try {
    normalizeDetail({
      ...fake,
      restaurant: { id: 123, displayName: 'Secret pretend name' },
    });
  } catch (e) {
    expect(String(e)).not.toContain('Secret pretend name');
  }
});
