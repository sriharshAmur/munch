import type { Order } from '../core/schema';
// Counts only. Never print a name, a price, a date or any other value from an order.
export function coverage(orders: Order[]) {
  const count = (test: (o: Order) => boolean) => orders.filter(test).length;
  const distinct = (key: (o: Order) => string) =>
    new Set(orders.map(key)).size;
  const items = orders.map((o) => o.items.length).sort((a, b) => a - b);
  return {
    'orders': orders.length,
    'distinct restaurants': distinct((o) => o.restaurant.id),
    'distinct homes': distinct((o) => o.home.key),
    'distinct cuisines': new Set(orders.flatMap((o) => o.restaurant.cuisines))
      .size,
    'distinct dish names': new Set(
      orders.flatMap((o) => o.items.map((i) => `${o.restaurant.id}:${i.name}`)),
    ).size,
    'with deliveredAt': count((o) => o.deliveredAt !== null),
    'group orders': count((o) => o.group.isGroup),
    'group size known': count((o) => o.group.isGroup && o.group.groupSize !== null),
    'pickup': count((o) => o.fulfilment === 'pickup'),
    'cancelled': count((o) => o.status === 'cancelled'),
    'status unknown': count((o) => o.status === 'unknown'),
    'payment known': count((o) => o.payment !== null),
    'with item options': count((o) => o.items.some((i) => i.options.length > 0)),
    'with tip': count((o) => o.money.tip > 0),
    'with discount': count((o) => o.money.discount > 0),
    'with delivery fee': count((o) => o.money.deliveryFee > 0),
    'with service fee': count((o) => o.money.serviceFee > 0),
    'with small-order fee': count((o) => o.money.smallOrderFee > 0),
    'with adjustments': count((o) => o.money.adjustments !== 0),
    'median items per order': items[Math.floor(items.length / 2)] ?? 0,
    'max items per order': items.at(-1) ?? 0,
  };
}
