import { test, expect } from 'bun:test';
import { MoneySchema } from './schema';
const money = {
  items: 1000,
  deliveryFee: 100,
  serviceFee: 50,
  smallOrderFee: 0,
  tip: 100,
  discount: 200,
  total: 1050,
  currency: 'EUR',
};
test('old files default adjustments to zero and reject unbalanced totals', () => {
  expect(MoneySchema.parse(money).adjustments).toBe(0);
  expect(MoneySchema.safeParse({ ...money, total: 1051 }).success).toBe(false);
  expect(
    MoneySchema.parse({ ...money, adjustments: -50, total: 1000 }).total,
  ).toBe(1000);
});
