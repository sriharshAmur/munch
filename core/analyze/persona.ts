import type { Order } from '../schema';
import { delivered, local, median, sorted } from './shared';
import { regulars } from './regulars';

export type TraitKey =
  | 'regular'
  | 'explorer'
  | 'night'
  | 'host'
  | 'weekender'
  | 'clockwork';

export type Trait = {
  key: TraitKey;
  /** The share of orders that show this habit, from 0 to 1. */
  share: number;
  /** The share at which the habit counts as strong. Chosen by judgement, see decision 0007. */
  strong: number;
  /** share / strong: above 1 means the habit is stronger than the bar. */
  score: number;
};

// The bars are deliberately plain: a third of orders at a place you'd never tried
// is a lot; so is one order in ten after 22:00.
const strong: Record<TraitKey, number> = {
  regular: 0.5,
  explorer: 0.3,
  night: 0.1,
  host: 0.2,
  weekender: 0.62,
  clockwork: 0.6,
};

const minutesOf = (o: Order) => {
  const p = local(o.placedAt);
  return p.hour * 60 + p.minute;
};

/** Your usual dinner time, in minutes after midnight, and how many orders land near it. */
export function clockwork(orders: Order[]) {
  const dinners = delivered(orders)
    .map(minutesOf)
    .filter((m) => m >= 16 * 60 && m < 23 * 60);
  const centre = Math.round(median(dinners));
  const near = dinners.filter((m) => Math.abs(m - centre) <= 45).length;
  return {
    centre,
    dinners: dinners.length,
    share: orders.length ? near / delivered(orders).length : 0,
  };
}

export function persona(orders: Order[], history: Order[] = orders) {
  const o = delivered(orders);
  if (o.length < 10) return null;
  const firsts = new Set<string>(),
    seen = new Set<string>();
  for (const v of sorted(history))
    if (!seen.has(v.restaurant.id)) {
      seen.add(v.restaurant.id);
      firsts.add(v.id);
    }
  const share = (test: (v: Order) => boolean) =>
    o.filter(test).length / o.length;
  const shares: Record<TraitKey, number> = {
    regular: regulars(o).topThreeShare,
    explorer: share((v) => firsts.has(v.id)),
    night: share((v) => {
      const m = minutesOf(v);
      return m >= 22 * 60 || m < 5 * 60;
    }),
    host: share((v) => v.group.isGroup),
    weekender: share((v) => local(v.placedAt).weekday >= 4),
    clockwork: clockwork(o).share,
  };
  const traits: Trait[] = (Object.keys(shares) as TraitKey[])
    .map((key) => ({
      key,
      share: shares[key],
      strong: strong[key],
      score: shares[key] / strong[key],
    }))
    .sort((a, b) => b.score - a.score);
  const top = traits[0];
  if (!top) return null;
  return {
    type: top.key,
    traits,
    runnerUp: traits[1]?.key ?? null,
    clockwork: clockwork(o).centre,
    orders: o.length,
  };
}
