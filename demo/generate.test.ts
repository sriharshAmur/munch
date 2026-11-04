import { expect, test } from 'bun:test';
import { generateDemo } from './generate';
test('the demo repeats, balances its cents and contains three homes and changing habits', () => {
  const a = generateDemo();
  expect(a).toEqual(generateDemo());
  expect(a.orders.length).toBeGreaterThan(1200);
  expect(new Set(a.orders.map((o) => o.home.key)).size).toBe(3);
  expect(new Set(a.orders.map((o) => o.restaurant.id)).size).toBeGreaterThan(
    40,
  );
  for (const o of a.orders)
    expect(o.money.total).toBe(
      o.money.items +
        o.money.deliveryFee +
        o.money.serviceFee +
        o.money.smallOrderFee +
        o.money.tip -
        o.money.discount,
    );
});
