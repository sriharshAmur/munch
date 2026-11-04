import type { Order } from '../schema';
import { groups, local, range, sorted, sum } from './shared';
export function timeline(orders: Order[]) {
  const o = sorted(orders),
    r = range(o),
    byMonth = groups(o, (v) => local(v.placedAt).date.slice(0, 7));
  const months: { month: string; count: number; spend: number }[] = [];
  if (r.first && r.last) {
    const first = local(r.first),
      last = local(r.last);
    for (
      let index = first.year * 12 + first.month - 1;
      index <= last.year * 12 + last.month - 1;
      index++
    ) {
      const month = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`,
        rows = byMonth.get(month) ?? [];
      months.push({
        month,
        count: rows.length,
        spend: sum(rows.map((v) => v.money.total)),
      });
    }
  }
  return {
    months,
    homes: [...groups(o, (v) => v.home.key)].map(([key, v]) => ({
      key,
      ...range(v),
      city: v[0]?.home.city ?? '',
    })),
    busiest: [...months].sort((a, b) => b.count - a.count)[0] ?? null,
    surge: surge(months),
  };
}
/**
 * The stretch of months that stands furthest above your usual month: a lockdown,
 * a new job, a winter. At least three months long and at least 30% busier.
 */
export function surge(months: { month: string; count: number }[]) {
  if (months.length < 9) return null;
  const counts = months.map((m) => m.count);
  const typical = [...counts].sort((a, b) => a - b)[Math.floor(counts.length / 2)] ?? 0;
  if (!typical) return null;
  let best: { start: string; end: string; ratio: number; excess: number } | null = null;
  for (let length = 3; length <= Math.min(18, months.length - 3); length++)
    for (let i = 0; i + length <= months.length; i++) {
      const window = counts.slice(i, i + length);
      const total = window.reduce((a, b) => a + b, 0);
      const ratio = total / length / typical;
      const excess = total - typical * length;
      if (ratio >= 1.3 && (!best || excess > best.excess))
        best = {
          start: months[i]?.month ?? '',
          end: months[i + length - 1]?.month ?? '',
          ratio,
          excess,
        };
    }
  return best;
}
