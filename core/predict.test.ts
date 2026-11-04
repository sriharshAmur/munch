import { test, expect } from 'bun:test';
import { generateDemo, DEMO_NOW } from '../demo/generate';
import { predict, backtest } from './predict';
const orders = generateDemo().orders;
test('prediction stays in the next seven days and ignores future history', () => {
  const result = predict(orders, DEMO_NOW);
  expect(result).not.toBeNull();
  if (!result) return;
  expect(Date.parse(result.window.time)).toBeGreaterThanOrEqual(
    Date.parse(DEMO_NOW),
  );
  expect(Date.parse(result.window.time)).toBeLessThan(
    Date.parse(DEMO_NOW) + 7 * 86400000,
  );
  const cutoff = orders[800]?.placedAt ?? DEMO_NOW;
  expect(predict(orders, cutoff)).toEqual(
    predict(
      orders.filter((o) => Date.parse(o.placedAt) < Date.parse(cutoff)),
      cutoff,
    ),
  );
  expect(predict([], DEMO_NOW)).toBeNull();
});
test('the backtest replays held-out orders and reports raw hit counts', () => {
  const b = backtest(orders, 12);
  expect(b.tested).toBe(12);
  expect(b.top3).toBeGreaterThanOrEqual(b.top1);
  expect(b.top3).toBeLessThanOrEqual(12);
  expect(b.top1Rate).toBe(b.top1 / 12);
  expect(backtest([]).tested).toBe(0);
});
