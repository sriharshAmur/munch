import { test, expect } from 'bun:test';
import { parsePage, nextPage } from './fetch';
const origin = 'https://example.invalid/own-history';
test('follows supplied history links and stops at the end', () => {
  const first = parsePage({
    orders: [{ id: 'fake' }],
    _pagination: {
      total: null,
      count: 1,
      links: { next: { href: '?cursor=fake', templated: false } },
    },
  });
  expect(nextPage(first, origin, origin)).toBe(`${origin}?cursor=fake`);
  const end = parsePage({
    orders: [{ id: 'fake' }],
    _pagination: { total: null, count: 1, links: {} },
  });
  expect(nextPage(end, origin, origin)).toBeNull();
});
test('does not forward credentials to another host or route', () => {
  const page = (href: string) =>
    parsePage({
      orders: [{ id: 'fake' }],
      _pagination: { total: 1, count: 1, links: { next: { href } } },
    });
  expect(() =>
    nextPage(page('https://another.invalid/own-history'), origin, origin),
  ).toThrow();
  expect(() => nextPage(page('/some-other-person'), origin, origin)).toThrow();
});
test('malformed history reports fields without values', () => {
  expect(() => parsePage({ orders: 'Private pretend value' })).toThrow(
    'orders',
  );
  try {
    parsePage({ orders: 'Private pretend value' });
  } catch (e) {
    expect(String(e)).not.toContain('Private pretend value');
  }
});
