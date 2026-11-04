import { expect, test } from 'bun:test';
import { generateDemo, DEMO_NOW } from '../../demo/generate';
import { matchOrder, placeProfile, placeProfiles } from './place';

const demo = generateDemo().orders;

test('a place you dropped is gone quiet, a ritual place is a regular', () => {
  expect(placeProfile(demo, 'demo-fennel-fold', DEMO_NOW)?.status).toBe('gone-quiet');
  const tin = placeProfile(demo, 'demo-sunday-tin', DEMO_NOW);
  expect(tin?.weekdays[6]).toBe(tin?.count);
  expect(tin?.dishes[0]?.name).toBe('Shakshuka');
  expect(placeProfile(demo, 'demo-velvet-nori', DEMO_NOW)?.status).toBe('old-home');
  expect(placeProfile(demo, 'nowhere', DEMO_NOW)).toBeNull();
});

test('a profile lines its months up with the whole history and tracks dish prices', () => {
  const p = placeProfile(demo, 'demo-velvet-nori', DEMO_NOW);
  const all = placeProfile(demo, 'demo-saffron-hour', DEMO_NOW);
  expect(p?.months.length).toBe(all?.months.length);
  expect(p?.months.reduce((s, m) => s + m.count, 0)).toBe(p?.count);
  expect(p?.dishes.find((d) => d.name === 'Salmon maki box')?.change).toBeGreaterThan(0.05);
});

test('places are ranked by orders, and search needs every word', () => {
  const places = placeProfiles(demo, DEMO_NOW);
  expect(places[0]?.rank).toBe(1);
  expect(places[0]?.count).toBeGreaterThanOrEqual(places[1]?.count ?? 0);
  expect(places.length).toBe(new Set(demo.map((o) => o.restaurant.id)).size);
  const order = demo.find((o) => o.restaurant.id === 'demo-saffron-hour' && o.items.some((i) => i.name === 'Falafel plate'));
  if (!order) throw Error('Expected a falafel order');
  expect(matchOrder(order, 'saffron falafel')).toBe(true);
  expect(matchOrder(order, 'saffron sushi')).toBe(false);
  expect(matchOrder(order, '  ')).toBe(true);
});
