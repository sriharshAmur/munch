import type { Order } from '../schema';
export const DAY = 86400000;
export const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'long',
  hourCycle: 'h23',
});
export type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  date: string;
};
// Formatting a date in Amsterdam time is slow and every analysis asks for the same
// orders many times over, so the parts are remembered per timestamp.
const cache = new Map<string, LocalParts>();
export function local(iso: string): LocalParts {
  const known = cache.get(iso);
  if (known) return known;
  const parts = parse(iso);
  if (cache.size > 50000) cache.clear();
  cache.set(iso, parts);
  return parts;
}
function parse(iso: string): LocalParts {
  const p = formatter.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    p.find((v) => v.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: weekdays.indexOf(get('weekday')),
    date: `${get('year')}-${get('month')}-${get('day')}`,
  };
}
export const delivered = (orders: Order[]) =>
  orders.filter((o) => o.status !== 'cancelled');
export const sorted = (orders: Order[]) =>
  [...delivered(orders)].sort(
    (a, b) => Date.parse(a.placedAt) - Date.parse(b.placedAt),
  );
export const sum = (numbers: number[]) => numbers.reduce((a, b) => a + b, 0);
export const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b),
    n = s.length;
  return n
    ? ((s[Math.floor((n - 1) / 2)] ?? 0) + (s[Math.floor(n / 2)] ?? 0)) / 2
    : 0;
};
export function mode(values: number[]) {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
}
export function typical(orders: Order[]) {
  const parts = orders.map((o) => local(o.placedAt));
  return {
    weekday: mode(parts.map((p) => p.weekday)),
    hour: Math.round(median(parts.map((p) => p.hour + p.minute / 60))) % 24,
  };
}
export function groups<T>(values: T[], key: (v: T) => string) {
  const result = new Map<string, T[]>();
  for (const v of values) {
    const k = key(v);
    result.set(k, [...(result.get(k) ?? []), v]);
  }
  return result;
}
export function range(orders: Order[]) {
  const s = sorted(orders);
  return {
    first: s[0]?.placedAt ?? null,
    last: s.at(-1)?.placedAt ?? null,
    days: s.length
      ? Math.max(
          1,
          (Date.parse(s.at(-1)?.placedAt ?? '') -
            Date.parse(s[0]?.placedAt ?? '')) /
            DAY +
            1,
        )
      : 0,
  };
}
