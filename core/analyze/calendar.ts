import type { Order } from '../schema';
import { DAY, groups, local, sorted } from './shared';
export function calendar(orders: Order[]) {
  const o = sorted(orders),
    counts = groups(o, (v) => local(v.placedAt).date),
    first = o[0],
    last = o.at(-1);
  const days: { date: string; count: number }[] = [];
  if (first && last)
    for (
      let t = Date.parse(local(first.placedAt).date);
      t <= Date.parse(local(last.placedAt).date);
      t += DAY
    ) {
      const date = new Date(t).toISOString().slice(0, 10);
      days.push({ date, count: counts.get(date)?.length ?? 0 });
    }
  let streak = { start: '', end: '', days: 0 },
    gap = { start: '', end: '', days: 0 },
    run = 0,
    empty = 0;
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (!day) continue;
    run = day.count ? run + 1 : 0;
    empty = day.count ? 0 : empty + 1;
    if (run > streak.days)
      streak = {
        start: days[i - run + 1]?.date ?? '',
        end: day.date,
        days: run,
      };
    if (empty > gap.days)
      gap = {
        start: days[i - empty + 1]?.date ?? '',
        end: day.date,
        days: empty,
      };
  }
  const weeks = [
    ...groups(days, (v) => {
      const d = new Date(v.date);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      return d.toISOString().slice(0, 10);
    }),
  ].map(([start, v]) => ({ start, count: v.reduce((s, d) => s + d.count, 0) }));
  return {
    days,
    /** Monday-first weeks, oldest first, empty weeks included. */
    weeks,
    streak,
    gap,
    busiestWeek: [...weeks].sort((a, b) => b.count - a.count)[0] ?? null,
  };
}
