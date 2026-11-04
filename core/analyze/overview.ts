import type { Order } from '../schema';
import { DAY, groups, local, median, sorted, sum } from './shared';
import { calendar } from './calendar';
import { company } from './company';
import { dishes } from './dishes';
import { regulars } from './regulars';

/** The day starts at 05:00, so a 01:00 order belongs to the night before. */
export const DAY_START = 5;

/**
 * Everything the home page's cards show, from one set of orders. Built for about
 * a year of history: weeks rather than months, a single calendar, a few homes.
 */
export function overview(orders: Order[]) {
  const o = sorted(orders);
  const count = o.length;
  const parts = o.map((v) => local(v.placedAt));

  const hours = Array.from({ length: 24 }, (_, h) => parts.filter((p) => p.hour === h).length);
  const days = Array.from({ length: 7 }, (_, d) => parts.filter((p) => p.weekday === d).length);
  // The busiest three hours in a row, read around midnight.
  let window = { hour: 0, count: 0 };
  for (let h = 0; h < 24; h++) {
    const c = (hours[h] ?? 0) + (hours[(h + 1) % 24] ?? 0) + (hours[(h + 2) % 24] ?? 0);
    if (c > window.count) window = { hour: h, count: c };
  }
  const topDay = days.reduce((best, c, d) => (c > (days[best] ?? 0) ? d : best), 0);
  const quietDay = days.reduce((best, c, d) => (c < (days[best] ?? 0) ? d : best), 0);

  // Weeks from the first order's Monday to the last order's, each split by home.
  const cal = calendar(o);
  const byWeek = groups(o, (v) => {
    const d = new Date(`${local(v.placedAt).date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  });
  const weeks = cal.weeks.map((w) => {
    const rows = byWeek.get(w.start) ?? [];
    return {
      start: w.start,
      count: rows.length,
      spend: sum(rows.map((v) => v.money.total)),
      homes: [...groups(rows, (v) => v.home.key)].map(([key, r]) => ({ key, count: r.length })),
    };
  });
  const busiestWeek = weeks.reduce<(typeof weeks)[number] | null>((b, w) => (!b || w.count > b.count ? w : b), null);
  const months = [...groups(o, (v) => local(v.placedAt).date.slice(0, 7))].map(([month, rows]) => ({
    month,
    count: rows.length,
  }));
  const busiestMonth = months.reduce<(typeof months)[number] | null>((b, m) => (!b || m.count > b.count ? m : b), null);

  // What an order costs: €5 bins up to where nearly every order sits, then one open bin.
  const totals = o.map((v) => v.money.total).sort((a, b) => a - b);
  const p95 = totals[Math.floor((totals.length - 1) * 0.95)] ?? 0;
  const edge = Math.max(2500, Math.ceil(p95 / 500) * 500);
  const bins = Array.from({ length: edge / 500 + 1 }, (_, i) => ({
    from: i * 500,
    to: i * 500 + 500,
    open: i === edge / 500,
    count: 0,
  }));
  for (const t of totals) {
    const bin = bins[Math.min(bins.length - 1, Math.floor(t / 500))];
    if (bin) bin.count++;
  }
  const money = {
    food: sum(o.map((v) => v.money.items)),
    delivery: sum(o.map((v) => v.money.deliveryFee)),
    service: sum(o.map((v) => v.money.serviceFee + v.money.smallOrderFee)),
    tip: sum(o.map((v) => v.money.tip)),
    discount: sum(o.map((v) => v.money.discount)),
    total: sum(o.map((v) => v.money.total)),
  };

  const placeList = regulars(o).places;
  const homeList = [...groups(o, (v) => v.home.key)].map(([key, rows]) => ({
    key,
    city: rows[0]?.home.city ?? '',
    count: rows.length,
    first: rows[0]?.placedAt ?? '',
    last: rows.at(-1)?.placedAt ?? '',
    top: regulars(rows).places[0]?.name ?? '',
  }));

  const span = o.length ? (Date.parse(o.at(-1)?.placedAt ?? '') - Date.parse(o[0]?.placedAt ?? '')) / DAY + 1 : 0;
  return {
    count,
    first: o[0]?.placedAt ?? null,
    last: o.at(-1)?.placedAt ?? null,
    span,
    everyDays: count ? span / count : 0,
    hours,
    days,
    window: { ...window, share: count ? window.count / count : 0 },
    topDay,
    quietDay,
    weeks,
    busiestWeek,
    months,
    busiestMonth,
    calendar: { days: cal.days, streak: cal.streak, gap: cal.gap },
    places: placeList.map((p) => ({ id: p.id, name: p.name, count: p.count, spend: p.spend, usual: p.usual, share: count ? p.count / count : 0 })),
    oneTimers: placeList.filter((p) => p.count === 1).length,
    dishes: dishes(o).ranked.slice(0, 6),
    cost: { median: Math.round(median(totals)), bins, money, feeShare: money.total ? (money.delivery + money.service) / money.total : 0 },
    company: company(o),
    homes: homeList,
  };
}
export type Overview = ReturnType<typeof overview>;
