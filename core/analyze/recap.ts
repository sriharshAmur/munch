import type { Order } from '../schema';
import { delivered, groups, local, sum, typical, weekdays } from './shared';
import { regulars } from './regulars';
import { dishes } from './dishes';
import { persona } from './persona';

/** A story's span: everything you have, one calendar year, or one month ("2026-03"). */
export type Period = 'all' | number | string;

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const monthIndex = (key: string) => Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;
const monthOf = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
const monthLabel = (key: string) => `${monthNames[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

function inPeriod(o: Order, period: Period) {
  const p = local(o.placedAt);
  return period === 'all' ? true : typeof period === 'number' ? p.year === period : p.date.startsWith(period);
}

/**
 * The handful of numbers one story needs. Thuisbezorgd keeps about a year of
 * orders, so the whole history is usually the "year", and months are the chapters.
 */
export function recap(history: Order[], period: Period = 'all') {
  const all = delivered(history).sort((a, b) => Date.parse(a.placedAt) - Date.parse(b.placedAt));
  const orders = all.filter((o) => inPeriod(o, period));
  const first = orders[0],
    last = orders.at(-1);
  if (!first || !last) return null;
  const kind = period === 'all' ? 'all' : typeof period === 'number' ? 'year' : 'month';

  const before = all.filter((o) => Date.parse(o.placedAt) < Date.parse(first.placedAt));
  const seen = new Set(before.map((o) => o.restaurant.id));
  const previousPeriod =
    kind === 'year' ? Number(period) - 1 : kind === 'month' ? monthOf(monthIndex(String(period)) - 1) : null;
  const previous = previousPeriod === null ? 0 : all.filter((o) => inPeriod(o, previousPeriod)).length;

  // The bars of the "when" slide: months for a year or the whole history, weekdays for a month.
  let buckets: { label: string; short: string; count: number }[];
  if (kind === 'month')
    buckets = weekdays.map((name, d) => ({
      label: `${name}s`,
      short: name.slice(0, 1),
      count: orders.filter((o) => local(o.placedAt).weekday === d).length,
    }));
  else {
    const from = kind === 'year' ? Number(period) * 12 : monthIndex(local(first.placedAt).date);
    const to = kind === 'year' ? Number(period) * 12 + 11 : monthIndex(local(last.placedAt).date);
    const byMonth = groups(orders, (o) => local(o.placedAt).date.slice(0, 7));
    buckets = Array.from({ length: to - from + 1 }, (_, i) => {
      const key = monthOf(from + i);
      return {
        label: kind === 'year' ? (monthNames[i] ?? '') : monthLabel(key),
        short: monthNames[Number(key.slice(5, 7)) - 1]?.slice(0, 1) ?? '',
        count: byMonth.get(key)?.length ?? 0,
      };
    });
  }
  const busiest = buckets.reduce((best, b) => (b.count > best.count ? b : best), buckets[0] ?? { label: '', short: '', count: 0 });

  const places = regulars(orders).places;
  const newPlaces = new Set(orders.filter((o) => !seen.has(o.restaurant.id)).map((o) => o.restaurant.id)).size;
  const days = Math.max(1, (Date.parse(last.placedAt) - Date.parse(first.placedAt)) / 86400000 + 1);
  const when = typical(orders);
  return {
    period,
    kind,
    label:
      kind === 'all' ? 'Your year' : kind === 'year' ? String(period) : monthNames[Number(String(period).slice(5, 7)) - 1] ?? '',
    title: kind === 'month' ? monthLabel(String(period)) : kind === 'year' ? String(period) : 'Your year in orders',
    previousLabel:
      previousPeriod === null ? null : typeof previousPeriod === 'number' ? String(previousPeriod) : monthNames[Number(previousPeriod.slice(5, 7)) - 1] ?? null,
    first: first.placedAt,
    last: last.placedAt,
    count: orders.length,
    previous,
    spend: sum(orders.map((o) => o.money.total)),
    everyDays: days / orders.length,
    places: places.slice(0, 5).map((p) => ({ id: p.id, name: p.name, count: p.count, usual: p.usual })),
    restaurants: places.length,
    newPlaces,
    oneTimers: places.filter((p) => p.count === 1).length,
    dish: dishes(orders).ranked[0] ?? null,
    peak: { weekday: when.weekday, hour: when.hour },
    buckets,
    busiest,
    groupOrders: orders.filter((o) => o.group.isGroup).length,
    persona: persona(orders, history),
  };
}
export type Recap = NonNullable<ReturnType<typeof recap>>;

/** The stories worth telling: the whole history, then each month with a few orders, newest first. */
export function storyPeriods(history: Order[], minimum = 3): string[] {
  const months = groups(delivered(history), (o) => local(o.placedAt).date.slice(0, 7));
  return [...months]
    .filter(([, rows]) => rows.length >= minimum)
    .map(([key]) => key)
    .sort()
    .reverse();
}
