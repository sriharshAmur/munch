import type { Order } from '../schema';
import { groups, local, sorted } from './shared';
export function novelty(orders: Order[], history: Order[] = orders) {
  const firsts = new Set<string>(),
    seen = new Set<string>();
  for (const o of sorted(history)) {
    if (!seen.has(o.restaurant.id)) {
      firsts.add(o.id);
      seen.add(o.restaurant.id);
    }
  }
  return [...groups(sorted(orders), (v) => String(local(v.placedAt).year))].map(
    ([year, rows]) => ({
      year: Number(year),
      count: rows.length,
      newCount: rows.filter((v) => firsts.has(v.id)).length,
      share: rows.filter((v) => firsts.has(v.id)).length / rows.length,
    }),
  );
}
