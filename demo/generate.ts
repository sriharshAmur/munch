import { OrdersFileSchema, type Order, type OrdersFile } from '../core/schema';
export const DEMO_NOW = '2026-11-04T12:00:00+01:00';
export function generateDemo(): OrdersFile {
  let seed = 28417;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const cuisines = [
    'Sushi',
    'Pizza',
    'Indian',
    'Thai',
    'Burgers',
    'Surinamese',
    'Turkish',
    'Poke',
    'Chinese',
    'Italian',
    'Middle Eastern',
    'Breakfast',
  ];
  const roots = [
    'Moonspoon',
    'Pepper Post',
    'Little Lantern',
    'Velvet Nori',
    'Copper Apron',
    'Tamarind Type',
    'Seven Spoons',
    'Rice Almanac',
    'Miso Window',
    'Basil Parcel',
    'Saffron Hour',
    'Sunday Tin',
    'Cloud Kitchen',
    'Fennel Fold',
    'Noodle Attic',
  ];
  const dishes = [
    'Salmon rice bowl',
    'Mushroom pizza',
    'Chickpea curry',
    'Basil noodles',
    'Smoked bean burger',
    'Roti with pumpkin',
    'Grilled aubergine wrap',
    'Sesame poke bowl',
    'Ginger fried rice',
    'Spinach ravioli',
    'Falafel plate',
    'Eggs on toast',
  ];
  const homes = [
    { key: '1', postcode: '0001', city: 'Utrecht' },
    { key: '2', postcode: '0002', city: 'Amsterdam' },
    { key: '3', postcode: '0003', city: 'Rotterdam' },
  ];
  const restaurants = homes.flatMap((_, h) =>
    roots.map((root, i) => ({
      id: `demo-place-${h}-${i}`,
      name: `${root} ${['Yard', 'Room', 'Table'][h]}`,
      cuisines: [cuisines[i % cuisines.length]],
      dish: dishes[i % dishes.length],
      base: 1050 + (i % 7) * 125,
    })),
  );
  const orders: Order[] = [];
  const start = Date.UTC(2017, 2, 4),
    end = Date.UTC(2026, 9, 31);
  for (let day = start; day <= end; day += 86400000) {
    const d = new Date(day),
      year = d.getUTCFullYear(),
      month = d.getUTCMonth(),
      date = d.getUTCDate(),
      weekday = d.getUTCDay();
    if (month === 6 && date >= 8 && date <= 20 + (year % 7)) continue;
    const homeIndex =
      day < Date.UTC(2019, 6, 1) ? 0 : day < Date.UTC(2023, 1, 1) ? 1 : 2;
    const lockdown = day >= Date.UTC(2020, 2, 15) && day < Date.UTC(2021, 6, 1);
    const probability =
      (weekday === 5
        ? 0.7
        : weekday === 6
          ? 0.6
          : weekday === 0
            ? 0.42
            : 0.23) *
      (lockdown ? 1.65 : 1) *
      (date >= 26 ? 1.23 : 1) *
      0.91;
    const times =
      random() < probability ? (lockdown && random() < 0.14 ? 2 : 1) : 0;
    for (let n = 0; n < times; n++) {
      const group = (weekday === 5 || weekday === 6) && random() < 0.39;
      const groupSize = group ? 2 + Math.floor(random() * 5) : null;
      const lunch =
        (homeIndex === 1 && weekday === 0 && random() < 0.75) || n === 1;
      const hour = lunch
        ? 12 + Math.floor(random() * 2)
        : random() < 0.065
          ? 23
          : 18 + Math.floor(random() * 3);
      const minute = Math.floor(random() * 60);
      const summer = month >= 3 && month <= 8;
      const offset = summer ? '+02:00' : '+01:00';
      // Derive the actual Amsterdam offset, including the March and October transitions.
      const actualOffset =
        new Intl.DateTimeFormat('en', {
          timeZone: 'Europe/Amsterdam',
          timeZoneName: 'shortOffset',
        })
          .formatToParts(new Date(day + hour * 3600000))
          .find((p) => p.type === 'timeZoneName')?.value === 'GMT+2'
          ? '+02:00'
          : '+01:00';
      const placedAt = `${d.toISOString().slice(0, 10)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${actualOffset || offset}`;
      const favourite = random() < 0.72;
      let index =
        homeIndex * 15 +
        (favourite
          ? random() < 0.55
            ? year % 3 === 0
              ? 1
              : 0
            : random() < 0.65
              ? 2
              : 3
          : Math.floor(random() * 15));
      if (homeIndex === 1 && random() < 0.1) index = 0;
      const restaurant = restaurants[index];
      if (!restaurant) continue;
      const price =
        Math.round((restaurant.base * Math.pow(1.04, year - 2017)) / 5) * 5;
      const quantity = group ? 2 + Math.floor(random() * 2) : 1;
      const items = [
        {
          name: restaurant.dish,
          quantity,
          unitPrice: price,
          total: price * quantity,
          options: [],
        },
      ];
      if (random() < 0.36)
        items.push({
          name: 'Crispy vegetable side',
          quantity: 1,
          unitPrice: 375,
          total: 375,
          options: [],
        });
      const food = items.reduce((s, i) => s + i.total, 0),
        pickup = random() < 0.08;
      const deliveryFee = pickup ? 0 : Math.floor(random() * 8) * 50,
        serviceFee = year >= 2022 ? 75 + Math.floor(random() * 4) * 25 : 0,
        smallOrderFee = food < 1200 ? 100 : 0,
        tip = random() < 0.34 ? Math.floor(random() * 4 + 1) * 50 : 0,
        discount = random() < 0.11 ? 250 : 0;
      orders.push({
        id: `demo:${orders.length + 1}`,
        source: 'demo',
        placedAt,
        deliveredAt: null,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          cuisines: restaurant.cuisines,
        },
        fulfilment: pickup ? 'pickup' : 'delivery',
        group: group
          ? { isGroup: true, groupSize }
          : { isGroup: false, groupSize: null },
        items,
        money: {
          items: food,
          deliveryFee,
          serviceFee,
          smallOrderFee,
          tip,
          discount,
          adjustments: 0,
          total:
            food + deliveryFee + serviceFee + smallOrderFee + tip - discount,
          currency: 'EUR',
        },
        payment: random() < 0.85 ? 'iDEAL' : random() < 0.5 ? 'Card' : 'PayPal',
        home: homes[homeIndex] ?? homes[0],
        status: random() < 0.01 ? 'cancelled' : 'delivered',
      });
    }
  }
  return OrdersFileSchema.parse({
    version: 1,
    source: 'demo',
    generatedAt: DEMO_NOW,
    orders: orders.sort((a, b) => a.placedAt.localeCompare(b.placedAt)),
  });
}
if (import.meta.main) {
  const demo = generateDemo();
  await Bun.write('web/public/demo/orders.json', JSON.stringify(demo));
  process.stdout.write(`Generated ${demo.orders.length} made-up orders.\n`);
}
