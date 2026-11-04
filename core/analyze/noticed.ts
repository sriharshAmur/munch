import type { Order } from '../schema';
import { DAY, groups, local, median, sorted, sum } from './shared';
import { calendar } from './calendar';

/**
 * Small, specific things worth pointing out. Each finding appears only when the
 * history clearly supports it, so a short history gets a short list.
 */
export type Finding =
  | {
      kind: 'inflation';
      dish: string;
      restaurant: string;
      restaurantId: string;
      first: { price: number; at: string };
      last: { price: number; at: string };
      change: number;
      times: number;
    }
  | {
      kind: 'ghosted';
      restaurant: string;
      restaurantId: string;
      count: number;
      last: string;
      daysSince: number;
      usualGap: number;
    }
  | {
      kind: 'ritual';
      restaurant: string;
      restaurantId: string;
      weekday: number;
      part: 'lunch' | 'dinner' | 'late';
      count: number;
      share: number;
    }
  | { kind: 'one-timers'; count: number; restaurants: number }
  | {
      kind: 'moving-in';
      moves: {
        home: string;
        city: string;
        restaurant: string;
        at: string;
        daysAfter: number | null;
      }[];
    }
  | { kind: 'payday'; ratio: number }
  | { kind: 'late'; order: Order; minutes: number }
  | { kind: 'biggest'; order: Order; typical: number }
  | { kind: 'customiser'; share: number; option: string; times: number }
  | { kind: 'quiet-day'; weekday: number; count: number; busiest: number; busiestCount: number }
  | { kind: 'word'; word: string; count: number }
  | { kind: 'drought'; start: string; end: string; days: number }
  | { kind: 'streak'; start: string; end: string; days: number }
  | { kind: 'tipping'; year: number; before: number; after: number }
  | { kind: 'fees'; fees: number; total: number; share: number }
  | {
      kind: 'delivery-time';
      median: number;
      fastest: { restaurant: string; minutes: number } | null;
      measured: number;
    }
  | { kind: 'same-basket'; count: number; share: number; restaurant: string; times: number };

export type FindingKind = Finding['kind'];

const partOf = (hour: number): 'lunch' | 'dinner' | 'late' =>
  hour >= 5 && hour < 15 ? 'lunch' : hour >= 15 && hour < 22 ? 'dinner' : 'late';

// Words that say nothing about the food, in English and Dutch.
const filler = new Set(
  'with and the extra sparkling water menu large small medium portion regular side sides from your plate special combo deal maxi mini half whole piece pieces stuk stuks met van het een voor naar zonder groot klein middel saus sauce chef’s chef chefs'.split(
    ' ',
  ),
);

export function noticed(orders: Order[], now: string) {
  const o = sorted(orders);
  const found: Finding[] = [];
  if (o.length < 5) return found;
  const nowTime = Date.parse(now);
  const byPlace = groups(o, (v) => v.restaurant.id);

  // Personal inflation: the same dish, at the same place, then and now
  let inflation: Extract<Finding, { kind: 'inflation' }> | null = null;
  for (const rows of byPlace.values()) {
    const lines = rows.flatMap((v) =>
      v.items.map((i) => ({ name: i.name, price: i.unitPrice, at: v.placedAt })),
    );
    for (const [name, list] of groups(lines, (l) => l.name)) {
      const first = list[0],
        last = list.at(-1);
      if (!first || !last || list.length < 3 || first.price === 0) continue;
      if (Date.parse(last.at) - Date.parse(first.at) < 60 * DAY) continue;
      const change = (last.price - first.price) / first.price;
      if (change < 0.03) continue;
      if (!inflation || list.length * change > inflation.times * inflation.change)
        inflation = {
          kind: 'inflation',
          dish: name,
          restaurant: rows[0]?.restaurant.name ?? '',
          restaurantId: rows[0]?.restaurant.id ?? '',
          first: { price: first.price, at: first.at },
          last: { price: last.price, at: last.at },
          change,
          times: list.length,
        };
    }
  }
  if (inflation) found.push(inflation);

  // Ghosted: a place you kept going back to, then stopped, without moving away
  const latest = o.at(-1);
  let ghosted: Extract<Finding, { kind: 'ghosted' }> | null = null;
  for (const rows of byPlace.values()) {
    const last = rows.at(-1);
    if (!last || !latest || rows.length < 3) continue;
    if (last.home.key !== latest.home.key) continue;
    const gaps = rows
      .slice(1)
      .map((v, i) => (Date.parse(v.placedAt) - Date.parse(rows[i]?.placedAt ?? v.placedAt)) / DAY);
    const usualGap = Math.max(1, Math.round(median(gaps)));
    const daysSince = Math.floor((nowTime - Date.parse(last.placedAt)) / DAY);
    if (daysSince < Math.max(90, usualGap * 6)) continue;
    if (!ghosted || rows.length > ghosted.count)
      ghosted = {
        kind: 'ghosted',
        restaurant: last.restaurant.name,
        restaurantId: last.restaurant.id,
        count: rows.length,
        last: last.placedAt,
        daysSince,
        usualGap,
      };
  }
  if (ghosted) found.push(ghosted);

  // A ritual: one place, one weekday, one part of the day, again and again
  let ritual: Extract<Finding, { kind: 'ritual' }> | null = null;
  for (const rows of byPlace.values())
    for (const [key, list] of groups(rows, (v) => {
      const p = local(v.placedAt);
      return `${p.weekday}|${partOf(p.hour)}`;
    })) {
      const [weekday, part] = key.split('|');
      const share = list.length / rows.length;
      if (list.length < 5 || share < 0.4) continue;
      if (!ritual || list.length > ritual.count)
        ritual = {
          kind: 'ritual',
          restaurant: list[0]?.restaurant.name ?? '',
          restaurantId: list[0]?.restaurant.id ?? '',
          weekday: Number(weekday),
          part: part === 'lunch' || part === 'late' ? part : 'dinner',
          count: list.length,
          share,
        };
    }
  if (ritual) found.push(ritual);

  // Places you tried exactly once
  const once = [...byPlace.values()].filter((rows) => rows.length === 1).length;
  if (once >= 4 && once / byPlace.size >= 0.2)
    found.push({ kind: 'one-timers', count: once, restaurants: byPlace.size });

  // The first dinner in each new home
  const homes = [...groups(o, (v) => v.home.key)].sort(
    (a, b) => Date.parse(a[1][0]?.placedAt ?? '') - Date.parse(b[1][0]?.placedAt ?? ''),
  );
  if (homes.length >= 2) {
    const moves = homes.slice(1).flatMap(([key, rows], i) => {
      const first = rows[0],
        before = homes[i]?.[1].filter((v) => first && v.placedAt < first.placedAt).at(-1);
      if (!first) return [];
      return [
        {
          home: key,
          city: first.home.city,
          restaurant: first.restaurant.name,
          at: first.placedAt,
          daysAfter: before
            ? Math.round((Date.parse(first.placedAt) - Date.parse(before.placedAt)) / DAY)
            : null,
        },
      ];
    });
    if (moves.length) found.push({ kind: 'moving-in', moves });
  }

  // Payday: the days after the 25th
  const days = calendar(o).days;
  const isPayday = (d: string) => Number(d.slice(-2)) >= 25;
  const paydays = days.filter((d) => isPayday(d.date)),
    rest = days.filter((d) => !isPayday(d.date));
  if (o.length >= 40 && paydays.length >= 20 && rest.length) {
    const ratio =
      sum(paydays.map((d) => d.count)) / paydays.length / (sum(rest.map((d) => d.count)) / rest.length);
    if (ratio >= 1.15) found.push({ kind: 'payday', ratio });
  }

  // The latest night, counting past midnight as the same night
  const lateness = (v: Order) => {
    const p = local(v.placedAt);
    return ((p.hour + 19) % 24) * 60 + p.minute; // 05:00 is the earliest, 04:59 the latest
  };
  const lateness22_30 = 17 * 60 + 30; // 22:30 on that scale
  const latestNight = [...o].sort((a, b) => lateness(b) - lateness(a))[0];
  if (latestNight && lateness(latestNight) >= lateness22_30) {
    const p = local(latestNight.placedAt);
    found.push({ kind: 'late', order: latestNight, minutes: p.hour * 60 + p.minute });
  }

  // The biggest order
  const totals = o.map((v) => v.money.total);
  const biggest = [...o].sort((a, b) => b.money.total - a.money.total)[0];
  if (biggest && biggest.money.total >= median(totals) * 2)
    found.push({ kind: 'biggest', order: biggest, typical: Math.round(median(totals)) });

  // Customising: the option you ask for most
  const options = o.flatMap((v) => v.items.flatMap((i) => i.options));
  const customised = o.filter((v) => v.items.some((i) => i.options.length)).length;
  const favourite = [...groups(options, (x) => x)].sort((a, b) => b[1].length - a[1].length)[0];
  if (favourite && customised / o.length >= 0.25 && favourite[1].length >= 3)
    found.push({
      kind: 'customiser',
      share: customised / o.length,
      option: favourite[0],
      times: favourite[1].length,
    });

  // The quietest day of the week
  if (o.length >= 30) {
    const counts = Array.from({ length: 7 }, (_, d) => o.filter((v) => local(v.placedAt).weekday === d).length);
    const quiet = counts.indexOf(Math.min(...counts)),
      busy = counts.indexOf(Math.max(...counts));
    if ((counts[busy] ?? 0) >= 3 * Math.max(1, counts[quiet] ?? 0))
      found.push({
        kind: 'quiet-day',
        weekday: quiet,
        count: counts[quiet] ?? 0,
        busiest: busy,
        busiestCount: counts[busy] ?? 0,
      });
  }

  // The word that keeps turning up in what you order
  const words = new Map<string, number>();
  for (const v of o) {
    const inOrder = new Set(
      v.items.flatMap((i) =>
        i.name
          .toLowerCase()
          .split(/[^\p{L}]+/u)
          .filter((w) => w.length >= 4 && !filler.has(w)),
      ),
    );
    for (const w of inOrder) words.set(w, (words.get(w) ?? 0) + 1);
  }
  const word = [...words].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (word && word[1] >= 5 && word[1] / o.length >= 0.1)
    found.push({ kind: 'word', word: word[0], count: word[1] });

  // Streaks and droughts
  const c = calendar(o);
  if (c.streak.days >= 3) found.push({ kind: 'streak', ...c.streak });
  if (c.gap.days >= 14) found.push({ kind: 'drought', ...c.gap });

  // When tipping became a habit
  const years = [...new Set(o.map((v) => local(v.placedAt).year))].sort();
  let tipping: Extract<Finding, { kind: 'tipping' }> | null = null;
  for (const year of years.slice(1)) {
    const before = o.filter((v) => local(v.placedAt).year < year),
      after = o.filter((v) => local(v.placedAt).year >= year);
    if (before.length < 20 || after.length < 20) continue;
    const b = before.filter((v) => v.money.tip > 0).length / before.length,
      a = after.filter((v) => v.money.tip > 0).length / after.length;
    if (a - b >= 0.2 && (!tipping || a - b > tipping.after - tipping.before))
      tipping = { kind: 'tipping', year, before: b, after: a };
  }
  if (tipping) found.push(tipping);

  // Fees, as a plain share
  const fees = sum(o.map((v) => v.money.deliveryFee + v.money.serviceFee + v.money.smallOrderFee));
  const total = sum(totals);
  if (fees > 0 && total > 0) found.push({ kind: 'fees', fees, total, share: fees / total });

  // How long the wait usually is
  const waits = o.flatMap((v) =>
    v.deliveredAt && v.fulfilment === 'delivery'
      ? [{ v, minutes: (Date.parse(v.deliveredAt) - Date.parse(v.placedAt)) / 60000 }]
      : [],
  ).filter((w) => w.minutes > 0 && w.minutes < 180);
  if (waits.length >= 10) {
    const fastest = [...groups(waits, (w) => w.v.restaurant.id)]
      .filter(([, list]) => list.length >= 5)
      .map(([, list]) => ({
        restaurant: list[0]?.v.restaurant.name ?? '',
        minutes: Math.round(median(list.map((w) => w.minutes))),
      }))
      .sort((a, b) => a.minutes - b.minutes)[0];
    found.push({
      kind: 'delivery-time',
      median: Math.round(median(waits.map((w) => w.minutes))),
      fastest: fastest ?? null,
      measured: waits.length,
    });
  }

  // The exact same basket, again
  const baskets = new Map<string, number>();
  let repeats = 0;
  for (const v of o) {
    const key = `${v.restaurant.id}|${v.items
      .map((i) => `${i.quantity}×${i.name}[${[...i.options].sort().join(',')}]`)
      .sort()
      .join(';')}`;
    if (baskets.has(key)) repeats++;
    baskets.set(key, (baskets.get(key) ?? 0) + 1);
  }
  const top = [...baskets].sort((a, b) => b[1] - a[1])[0];
  if (top && repeats >= 5 && repeats / o.length >= 0.08)
    found.push({
      kind: 'same-basket',
      count: repeats,
      share: repeats / o.length,
      restaurant: o.find((v) => top[0].startsWith(`${v.restaurant.id}|`))?.restaurant.name ?? '',
      times: top[1],
    });

  return found;
}
