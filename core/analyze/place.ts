import type { Order } from '../schema';
import { DAY, groups, local, median, sorted, sum, typical } from './shared';

export type PlaceStatus = 'regular' | 'gone-quiet' | 'old-home' | 'one-time' | 'new' | 'now-and-then';

/** Everything worth knowing about one restaurant, from your orders there. */
export function placeProfile(history: Order[], id: string, now: string) {
  const all = sorted(history);
  const rows = all.filter((o) => o.restaurant.id === id);
  const first = rows[0],
    last = rows.at(-1);
  if (!first || !last) return null;
  const nowTime = Date.parse(now);
  const gaps = rows
    .slice(1)
    .map((o, i) => (Date.parse(o.placedAt) - Date.parse(rows[i]?.placedAt ?? o.placedAt)) / DAY);
  const usualGap = gaps.length ? Math.max(1, Math.round(median(gaps))) : null;
  const daysSince = Math.max(0, Math.floor((nowTime - Date.parse(last.placedAt)) / DAY));
  const daysKnown = Math.floor((nowTime - Date.parse(first.placedAt)) / DAY);
  // A place you left behind when you moved is not one you went off.
  const leftBehind = all.at(-1)?.home.key !== last.home.key;
  const status: PlaceStatus =
    leftBehind
      ? 'old-home'
      : rows.length === 1
      ? daysKnown < 45
        ? 'new'
        : 'one-time'
      : usualGap !== null && rows.length >= 3 && daysSince > Math.max(90, usualGap * 6)
        ? 'gone-quiet'
        : rows.length >= 4 && usualGap !== null && usualGap <= 30
          ? 'regular'
          : 'now-and-then';

  // One bar per month across your whole history, so places line up with each other.
  const months: { month: string; count: number }[] = [];
  const start = all[0] ? local(all[0].placedAt) : local(first.placedAt);
  const end = local(new Date(Math.max(nowTime, Date.parse(last.placedAt))).toISOString());
  const byMonth = groups(rows, (o) => local(o.placedAt).date.slice(0, 7));
  for (let i = start.year * 12 + start.month - 1; i <= end.year * 12 + end.month - 1; i++) {
    const key = `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
    months.push({ month: key, count: byMonth.get(key)?.length ?? 0 });
  }

  const dishes = [
    ...groups(
      rows.flatMap((o) => o.items.map((item) => ({ item, at: o.placedAt }))),
      (l) => l.item.name,
    ),
  ]
    .map(([name, lines]) => {
      const firstLine = lines[0],
        lastLine = lines.at(-1);
      const firstPrice = firstLine?.item.unitPrice ?? 0,
        lastPrice = lastLine?.item.unitPrice ?? 0;
      return {
        name,
        count: sum(lines.map((l) => l.item.quantity)),
        orders: new Set(lines.map((l) => l.at)).size,
        firstPrice,
        lastPrice,
        change: firstPrice && lines.length > 1 ? (lastPrice - firstPrice) / firstPrice : 0,
      };
    })
    .sort((a, b) => b.orders - a.orders || b.count - a.count || a.name.localeCompare(b.name));

  const spend = sum(rows.map((o) => o.money.total));
  // Same order as placeProfiles: most orders, then the most recent last order.
  const ranking = [...groups(all, (o) => o.restaurant.id)].sort(
    (a, b) =>
      b[1].length - a[1].length ||
      Date.parse(b[1].at(-1)?.placedAt ?? '') - Date.parse(a[1].at(-1)?.placedAt ?? ''),
  );
  return {
    id,
    name: first.restaurant.name,
    cuisine: first.restaurant.cuisines[0] ?? null,
    orders: rows,
    count: rows.length,
    share: all.length ? rows.length / all.length : 0,
    rank: ranking.findIndex(([key]) => key === id) + 1,
    spend,
    average: Math.round(spend / rows.length),
    first: first.placedAt,
    last: last.placedAt,
    daysSince,
    usualGap,
    status,
    months,
    weekdays: Array.from({ length: 7 }, (_, d) => rows.filter((o) => local(o.placedAt).weekday === d).length),
    hours: Array.from({ length: 24 }, (_, h) => rows.filter((o) => local(o.placedAt).hour === h).length),
    typical: typical(rows),
    dishes,
    groupOrders: rows.filter((o) => o.group.isGroup).length,
    homes: [...new Set(rows.map((o) => o.home.key))],
  };
}
export type PlaceProfile = NonNullable<ReturnType<typeof placeProfile>>;

/** Profiles for every restaurant, most orders first. */
export function placeProfiles(history: Order[], now: string) {
  return [...new Set(history.filter((o) => o.status !== 'cancelled').map((o) => o.restaurant.id))]
    .flatMap((id) => {
      const p = placeProfile(history, id, now);
      return p ? [p] : [];
    })
    .sort((a, b) => b.count - a.count || Date.parse(b.last) - Date.parse(a.last));
}

/**
 * Whether an order matches every word of a search, across the restaurant, its
 * dishes and their options, plus any extra text such as the date written out.
 */
export function matchOrder(order: Order, query: string, extra: string[] = []) {
  const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = [
    order.restaurant.name,
    ...order.items.flatMap((i) => [i.name, ...i.options]),
    order.payment ?? '',
    ...extra,
  ]
    .join(' ')
    .toLocaleLowerCase();
  return words.every((w) => text.includes(w));
}
