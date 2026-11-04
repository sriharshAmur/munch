import { expect, test } from 'bun:test';
import { generateDemo, DEMO_NOW } from './generate';
import { local } from '../core/analyze/shared';
const demo = generateDemo();
test('the demo is one year, repeats, balances its cents and spans two homes', () => {
  expect(demo).toEqual(generateDemo());
  expect(demo.orders.length).toBeGreaterThan(60);
  expect(demo.orders.length).toBeLessThan(200);
  const first = Date.parse(demo.orders[0]?.placedAt ?? ''),
    last = Date.parse(demo.orders.at(-1)?.placedAt ?? '');
  expect((last - first) / 86400000).toBeLessThan(366);
  expect(new Set(demo.orders.map((o) => o.home.key)).size).toBe(2);
  expect(new Set(demo.orders.map((o) => o.restaurant.id)).size).toBeGreaterThan(
    20,
  );
  for (const o of demo.orders)
    expect(o.money.total).toBe(
      o.money.items +
        o.money.deliveryFee +
        o.money.serviceFee +
        o.money.smallOrderFee +
        o.money.tip -
        o.money.discount,
    );
});
test('one favourite survives the first move and another is quietly dropped', () => {
  const homesOf = (id: string) =>
    new Set(
      demo.orders.filter((o) => o.restaurant.id === id).map((o) => o.home.key),
    );
  expect(homesOf('demo-little-lantern').size).toBe(2);
  const dropped = demo.orders.filter(
    (o) => o.restaurant.id === 'demo-fennel-fold',
  );
  expect(dropped.length).toBeGreaterThanOrEqual(3);
  expect(Date.parse(DEMO_NOW) - Date.parse(dropped.at(-1)?.placedAt ?? '')).toBeGreaterThan(
    90 * 86400000,
  );
});
test('Sunday lunch only happens on Sundays, and orders keep their minutes', () => {
  const ritual = demo.orders.filter((o) => o.restaurant.id === 'demo-sunday-tin');
  expect(ritual.length).toBeGreaterThanOrEqual(4);
  expect(ritual.every((o) => local(o.placedAt).weekday === 6)).toBe(true);
  expect(new Set(demo.orders.map((o) => local(o.placedAt).minute)).size).toBeGreaterThan(30);
});
