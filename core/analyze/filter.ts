import type { Order } from '../schema';
import { delivered, local } from './shared';
export type OrderFilter = {
  includeCancelled?: boolean;
  year?: number;
  home?: string;
  restaurant?: string;
  weekday?: number;
  hour?: number;
  month?: string;
  date?: string;
  /** The Monday a week starts on, "2026-03-02". */
  week?: string;
  /** Order totals in cents, from min up to but not including max. */
  min?: number;
  max?: number;
  fulfilment?: string;
  company?: string;
};
export function applyFilter(orders: Order[], filter: OrderFilter = {}) {
  return (filter.includeCancelled ? orders : delivered(orders)).filter((o) => {
    const p = local(o.placedAt);
    return (
      (filter.year === undefined || p.year === filter.year) &&
      (!filter.home || o.home.key === filter.home) &&
      (!filter.restaurant || o.restaurant.id === filter.restaurant) &&
      (filter.weekday === undefined || p.weekday === filter.weekday) &&
      (filter.hour === undefined || p.hour === filter.hour) &&
      (!filter.month || p.date.startsWith(filter.month)) &&
      (!filter.date || p.date === filter.date) &&
      (!filter.week || inWeek(p.date, filter.week)) &&
      (filter.min === undefined || o.money.total >= filter.min) &&
      (filter.max === undefined || o.money.total < filter.max) &&
      (!filter.fulfilment || o.fulfilment === filter.fulfilment) &&
      (!filter.company || (filter.company === 'group') === o.group.isGroup)
    );
  });
}
const inWeek = (date: string, monday: string) => {
  const days = (Date.parse(date) - Date.parse(monday)) / 86400000;
  return days >= 0 && days < 7;
};
export const availableYears = (orders: Order[]) =>
  [...new Set(orders.map((o) => local(o.placedAt).year))].sort((a, b) => a - b);
export const availableHomes = (orders: Order[]) => [
  ...new Map(orders.map((o) => [o.home.key, o.home])).values(),
];
