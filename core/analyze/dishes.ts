import type { Order } from '../schema';
import { delivered, groups, local, sum } from './shared';
export function dishes(orders: Order[], history: Order[] = orders) {
  const o = delivered(orders);
  const cuisineRank = [
    ...groups(delivered(history), (v) => v.restaurant.cuisines[0] ?? 'Other'),
  ]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([name]) => name);
  const ranked = [
    ...groups(
      o.flatMap((v) =>
        v.items.map((i) => ({ ...i, restaurant: v.restaurant })),
      ),
      (i) => `${i.restaurant.id}:${i.name}`,
    ),
  ]
    .map(([id, rows]) => ({
      id,
      name: rows[0]?.name ?? '',
      restaurant: rows[0]?.restaurant.name ?? '',
      restaurantId: rows[0]?.restaurant.id ?? '',
      count: sum(rows.map((i) => i.quantity)),
    }))
    .sort((a, b) => b.count - a.count);
  const cuisines = [...groups(o, (v) => String(local(v.placedAt).year))]
    .sort()
    .map(([year, rows]) => ({
      year: Number(year),
      shares: [...cuisineRank, 'Other'].map((name, index) => {
        const count = rows.filter((v) =>
          name === 'Other'
            ? !cuisineRank.includes(v.restaurant.cuisines[0] ?? '')
            : v.restaurant.cuisines[0] === name,
        ).length;
        return { name, index, count, share: count / rows.length };
      }),
    }));
  const cuisineCounts = [
    ...groups(o, (v) => v.restaurant.cuisines[0] ?? 'Other'),
  ]
    .map(([name, rows]) => ({ name, count: rows.length }))
    .sort((a, b) => b.count - a.count);
  return { ranked, cuisines, cuisineRank, cuisineCounts };
}
