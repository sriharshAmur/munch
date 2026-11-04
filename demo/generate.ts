import { OrdersFileSchema, type Order, type OrdersFile } from '../core/schema';
// A made-up person. Every restaurant, dish and street is invented.
//
// Delivery sites keep about a year of order history, so the demo is one year
// too: roughly a hundred orders across two homes, with a move in April. The
// habits are modelled on how people really order, so every view has something
// to find: a few regulars per home, one favourite that survives the move, a
// Sunday lunch habit, late-night snacks, a place they quietly stopped ordering
// from, a price rise in spring, payday weekends and group dinners.
export const DEMO_NOW = '2026-11-04T12:00:00+01:00';

type Dish = { name: string; price: number; options?: string[] };
type Place = {
  id: string;
  name: string;
  cuisines: string[];
  homes: number[];
  weight: number;
  menu: Dish[];
  extras: Dish[];
  fee: number;
  kind?: 'late' | 'lunch' | 'group';
  until?: number;
  from?: number;
};

const homes = [
  { key: '1', postcode: '0001', city: 'Utrecht' },
  { key: '2', postcode: '0002', city: 'Amsterdam' },
];
const move = Date.UTC(2026, 3, 4);
const day = 86400000;

const fries: Dish[] = [
  { name: 'Fries with mayo', price: 395 },
  { name: 'Kroket', price: 325 },
  { name: 'Frikandel special', price: 375, options: ['Extra onion'] },
];
const drinks: Dish[] = [
  { name: 'Sparkling water', price: 295 },
  { name: 'Ginger lemonade', price: 425 },
];

function places(): Place[] {
  const p = (
    id: string,
    name: string,
    cuisine: string,
    homeList: number[],
    weight: number,
    menu: Dish[],
    extras: Dish[] = drinks,
    more: Partial<Place> = {},
  ): Place => ({
    id: `demo-${id}`,
    name,
    cuisines: [cuisine],
    homes: homeList,
    weight,
    menu,
    extras,
    fee: 0,
    ...more,
  });
  const regulars = [
    // Utrecht, until April
    p('velvet-nori', 'Velvet Nori', 'Sushi', [0], 26, [
      { name: 'Salmon maki box', price: 1450, options: ['Extra ginger', 'No wasabi'] },
      { name: 'Dragon roll', price: 1595 },
      { name: 'Chicken katsu bento', price: 1495 },
    ], [{ name: 'Edamame', price: 495 }, { name: 'Miso soup', price: 395 }]),
    p('pepper-post', 'Pepper Post', 'Pizza', [0], 15, [
      { name: 'Diavola', price: 1295, options: ['Extra chilli', 'Thin crust'] },
      { name: 'Margherita', price: 1095 },
      { name: 'Truffle mushroom', price: 1550 },
    ], [{ name: 'Garlic bread', price: 495 }, ...drinks], { kind: 'group' }),
    // The one that survives the move: two branches, one menu
    p('little-lantern', 'Little Lantern', 'Thai', [0, 1], 16, [
      { name: 'Pad see ew', price: 1450, options: ['Extra spicy', 'With tofu'] },
      { name: 'Green curry', price: 1550, options: ['Extra spicy'] },
      { name: 'Massaman curry', price: 1595 },
    ], [{ name: 'Spring rolls', price: 595 }, { name: 'Jasmine rice', price: 325 }]),
    p('night-fryer', 'Night Fryer', 'Snacks', [0], 0, fries, drinks, { kind: 'late' }),
    // Amsterdam, from April
    p('saffron-hour', 'Saffron Hour', 'Middle Eastern', [1], 24, [
      { name: 'Falafel plate', price: 1395, options: ['Extra hummus', 'No onion'] },
      { name: 'Shawarma wrap', price: 1295 },
      { name: 'Mezze for two', price: 2895 },
    ], [{ name: 'Baba ganoush', price: 650 }, ...drinks], { kind: 'group' }),
    p('rice-almanac', 'Rice Almanac', 'Surinamese', [1], 13, [
      { name: 'Roti with chicken', price: 1495, options: ['Extra pom', 'Spicy'] },
      { name: 'Moksi meti', price: 1650 },
    ]),
    p('sunday-tin', 'Sunday Tin', 'Breakfast', [1], 0, [
      { name: 'Shakshuka', price: 1450, options: ['Extra feta'] },
      { name: 'Pancake stack', price: 1295 },
    ], [{ name: 'Fresh orange juice', price: 495 }, { name: 'Flat white', price: 425 }], { kind: 'lunch' }),
    // Frequent at first, then never again, without moving away
    p('fennel-fold', 'Fennel Fold', 'Turkish', [1], 38, [
      { name: 'Lahmacun', price: 1095, options: ['Extra lemon'] },
      { name: 'Iskender', price: 1795 },
    ], [{ name: 'Ayran', price: 325 }], { until: Date.UTC(2026, 6, 4) }),
    p('noodle-attic', 'Noodle Attic', 'Chinese', [1], 7, [
      { name: 'Dan dan noodles', price: 1550 },
      { name: 'Mapo tofu', price: 1450 },
    ], [{ name: 'Pork dumplings', price: 695 }]),
    p('moon-fryer', 'Moon Fryer', 'Snacks', [1], 0, fries, drinks, { kind: 'late' }),
  ];
  // Places tried once or twice: the long tail
  const tail: [string, string, string, number, number][] = [
    ['tamarind-type', 'Tamarind Type', 'Indian', 0, 1550],
    ['bun-theory', 'Bun Theory', 'Burgers', 0, 1395],
    ['golden-ladle', 'Golden Ladle', 'Chinese', 0, 1350],
    ['anatolia-oven', 'Anatolia Oven', 'Turkish', 0, 1250],
    ['green-crate', 'Green Crate', 'Salads', 0, 1295],
    ['tiny-tortilla', 'Tiny Tortilla', 'Mexican', 1, 1395],
    ['bao-and-co', 'Bao and Co', 'Taiwanese', 1, 1550],
    ['olive-yard', 'Olive Yard', 'Greek', 1, 1650],
    ['pho-corner', 'Pho Corner', 'Vietnamese', 1, 1495],
    ['gochu-room', 'Gochu Room', 'Korean', 1, 1750],
    ['fire-and-flour', 'Fire and Flour', 'Pizza', 1, 1450],
    ['addis-table', 'Addis Table', 'Ethiopian', 1, 1695],
    ['cedar-leaf', 'Cedar Leaf', 'Lebanese', 1, 1595],
    ['lisbon-tart', 'Pastel House', 'Portuguese', 1, 1250],
    ['dock-tacos', 'Dock Tacos', 'Mexican', 1, 1450],
    ['wok-theory', 'Wok Theory', 'Chinese', 0, 1395],
    ['sour-and-salt', 'Sour and Salt', 'Thai', 1, 1495],
    ['big-bowl', 'Big Bowl', 'Poke', 0, 1450],
    ['masala-lane', 'Masala Lane', 'Indian', 1, 1595],
  ];
  return [
    ...regulars,
    ...tail.map(([id, name, cuisine, home, price]) =>
      p(id, name, cuisine, [home], 1, [
        { name: `${cuisine} special`, price },
        { name: 'Chef’s plate', price: price + 250 },
      ]),
    ),
  ].map((place, i) => ({ ...place, fee: [0, 99, 149, 199, 249, 299][i % 6] ?? 0 }));
}

export function generateDemo(): OrdersFile {
  let seed = 51_877;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () =>
    Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const pick = <T,>(values: T[], weight: (v: T) => number): T | undefined => {
    const total = values.reduce((s, v) => s + weight(v), 0);
    let r = random() * total;
    for (const v of values) if ((r -= weight(v)) <= 0) return v;
    return values.at(-1);
  };
  const offsetFor = (utc: number) =>
    new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Amsterdam',
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date(utc))
      .find((p) => p.type === 'timeZoneName')?.value === 'GMT+2'
      ? 2
      : 1;
  const all = places();
  const orders: Order[] = [];
  const start = Date.UTC(2025, 10, 6),
    end = Date.UTC(2026, 9, 31);
  const holiday = (t: number) =>
    (t >= Date.UTC(2026, 6, 18) && t < Date.UTC(2026, 7, 9)) ||
    (t >= Date.UTC(2025, 11, 23) && t < Date.UTC(2025, 11, 28));

  function place(
    when: number,
    minutes: number,
    homeIndex: number,
    kind: 'dinner' | 'late' | 'ritual',
    group: number | null,
  ) {
    const available = all.filter(
      (p) =>
        p.homes.includes(homeIndex) &&
        (p.until === undefined || when < p.until) &&
        (p.from === undefined || when >= p.from),
    );
    let restaurant: Place | undefined;
    if (kind === 'late') restaurant = available.find((p) => p.kind === 'late');
    else if (kind === 'ritual')
      restaurant = available.find((p) => p.id === 'demo-sunday-tin');
    else {
      const settling = homeIndex === 1 && when - move < 40 * day;
      restaurant =
        random() < (settling ? 0.55 : 0.3)
          ? pick(available.filter((p) => p.weight === 1), () => 1)
          : pick(
              available.filter((p) => p.weight > 1),
              (p) => p.weight * (group && p.kind === 'group' ? 4 : 1),
            );
    }
    if (!restaurant) return;
    // Menus went up in March
    const inflation = when >= Date.UTC(2026, 2, 1) ? 1.08 : 1;
    const priced = (dish: Dish) => Math.round((dish.price * inflation) / 5) * 5;
    const people = group ?? 1;
    const lines = new Map<string, { dish: Dish; quantity: number; options: string[] }>();
    const add = (dish: Dish) => {
      const options =
        dish.options && random() < 0.55
          ? [dish.options[Math.floor(random() * dish.options.length)] ?? '']
          : [];
      const key = `${dish.name}|${options.join(',')}`;
      const line = lines.get(key);
      if (line) line.quantity++;
      else lines.set(key, { dish, quantity: 1, options });
    };
    for (let i = 0; i < people; i++)
      add(
        (i === 0 && random() < 0.66
          ? restaurant.menu[0]
          : restaurant.menu[Math.floor(random() * restaurant.menu.length)]) ??
          restaurant.menu[0]!,
      );
    if (random() < 0.5 || people > 2) {
      const extra = restaurant.extras[Math.floor(random() * restaurant.extras.length)];
      if (extra) add(extra);
    }
    const items = [...lines.values()].map(({ dish, quantity, options }) => ({
      name: dish.name,
      quantity,
      unitPrice: priced(dish),
      total: priced(dish) * quantity,
      options,
    }));
    const food = items.reduce((s, i) => s + i.total, 0);
    const pickup = kind !== 'late' && random() < 0.06;
    const deliveryFee = pickup ? 0 : restaurant.fee,
      serviceFee = 99,
      smallOrderFee = food < 1500 && !pickup ? 100 : 0,
      tip = !pickup && random() < 0.3 ? (1 + Math.floor(random() * 3)) * 100 : 0,
      discount = random() < 0.08 ? Math.min(food, 300) : 0;
    const offset = offsetFor(when + minutes * 60000);
    const localTime = new Date(when + minutes * 60000);
    const placedAt = `${localTime.toISOString().slice(0, 16)}:00+0${offset}:00`;
    const delivery = 28 + Math.round(random() * 22 + (group ? 8 : 0));
    orders.push({
      id: `demo:${100000 + orders.length * 7}`,
      source: 'demo',
      placedAt,
      deliveredAt: pickup
        ? null
        : new Date(Date.parse(placedAt) + delivery * 60000)
            .toISOString()
            .replace('Z', '+00:00'),
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        cuisines: restaurant.cuisines,
      },
      fulfilment: pickup ? 'pickup' : 'delivery',
      group: group
        ? { isGroup: true, groupSize: group }
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
        total: food + deliveryFee + serviceFee + smallOrderFee + tip - discount,
        currency: 'EUR',
      },
      payment: random() < 0.35 ? 'Apple Pay' : random() < 0.85 ? 'iDEAL' : 'Card',
      home: homes[homeIndex] ?? homes[0]!,
      status: random() < 0.01 ? 'cancelled' : 'delivered',
    });
  }

  for (let t = start; t <= end; t += day) {
    const d = new Date(t),
      month = d.getUTCMonth(),
      date = d.getUTCDate(),
      weekday = (d.getUTCDay() + 6) % 7; // Monday first
    if (holiday(t)) continue;
    const homeIndex = t < move ? 0 : 1;
    // The first night in a new home always ends with a delivery
    const movingIn = t === move;
    const payday = date >= 25 ? 1.45 : date <= 3 ? 1.1 : 0.88;
    const winter = month <= 1 || month >= 10 ? 1.2 : month >= 5 && month <= 7 ? 0.8 : 1;
    const base = [0.11, 0.09, 0.13, 0.17, 0.52, 0.42, 0.19][weekday] ?? 0.12;
    if (movingIn || random() < Math.min(0.95, base * payday * winter)) {
      const weekend = weekday >= 4;
      const late = random() < (weekend ? 0.1 : 0.04);
      const minutes = late
        ? 22 * 60 + 30 + Math.floor(random() * 140)
        : Math.round(
            Math.min(
              22 * 60 + 15,
              Math.max(17 * 60, (weekend ? 19.75 : 19.1) * 60 + normal() * (weekend ? 45 : 35)),
            ),
          );
      const group =
        !late && (weekend && weekday !== 6 ? random() < 0.25 : random() < 0.04)
          ? 2 + Math.floor(random() * random() * 5)
          : null;
      place(t, minutes, homeIndex, late ? 'late' : 'dinner', group);
    }
    // Sunday lunch, most weeks, once settled in Amsterdam
    if (homeIndex === 1 && t > move + 20 * day && weekday === 6 && random() < 0.26)
      place(t, 11 * 60 + 40 + Math.floor(random() * 80), 1, 'ritual', random() < 0.3 ? 2 : null);
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
