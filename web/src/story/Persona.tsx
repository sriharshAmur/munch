import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Order } from '@core/schema';
import { persona, type TraitKey } from '@core/analyze/persona';
import { clock, percent } from '@/lib/format';
import { useReducedMotion } from './palette';

export const types: Record<TraitKey, { name: string; trait: string; line: (share: number, centre: number) => string }> = {
  regular: {
    name: 'a regular',
    trait: 'Loyal',
    line: (s) => `${percent(s)} of your orders went to just three places. They probably know your order by now.`,
  },
  explorer: {
    name: 'an explorer',
    trait: 'Exploring',
    line: (s) => `${percent(s)} of your orders came from somewhere you had never ordered from before.`,
  },
  night: {
    name: 'a night owl',
    trait: 'Late',
    line: (s) => `${percent(s)} of your orders came after 22:00. The kitchen closes eventually. You've checked.`,
  },
  host: {
    name: 'the host',
    trait: 'Sharing',
    line: (s) => `${percent(s)} of your orders were for a group. Dinner is better split a few ways.`,
  },
  weekender: {
    name: 'a weekender',
    trait: 'Weekend',
    line: (s) => `${percent(s)} of your orders land between Friday and Sunday. Monday to Thursday, someone cooks.`,
  },
  clockwork: {
    name: 'clockwork',
    trait: 'On time',
    line: (s, c) => `${percent(s)} of your orders land within 45 minutes of ${clock(c)}. You could set a watch by it.`,
  },
};

const describe: Record<TraitKey, string> = {
  regular: 'Orders at your top three places',
  explorer: 'Orders at a place you had never tried',
  night: 'Orders after 22:00',
  host: 'Group orders',
  weekender: 'Orders from Friday to Sunday',
  clockwork: 'Orders near your usual time',
};

export function Persona({ orders, history }: { orders: Order[]; history: Order[] }) {
  const p = useMemo(() => persona(orders, history), [orders, history]);
  const reduced = useReducedMotion();
  if (!p) return null;
  const top = p.traits[0];
  if (!top) return null;
  const t = types[p.type];
  return (
    <section className="persona" aria-labelledby="persona-title">
      <div className="persona-copy">
        <h2 id="persona-title" className="persona-title">
          You're {t.name}.
        </h2>
        <p className="persona-line">{t.line(top.share, p.clockwork)}</p>
        {p.runnerUp && (
          <p className="persona-runner">
            Runner-up: {types[p.runnerUp].name}. {describe[p.runnerUp]} make up {percent(p.traits[1]?.share ?? 0)} of the
            total.
          </p>
        )}
      </div>
      <ul className="traits" aria-label="Your habits, each against the line where it counts as strong">
        {p.traits.map((trait, i) => {
          const fill = Math.min(1, trait.share);
          return (
            <li key={trait.key} data-top={i === 0} data-strong={trait.share >= trait.strong}>
              <div className="trait-head">
                <span>{types[trait.key].trait}</span>
                <span className="trait-value">{percent(trait.share)}</span>
              </div>
              <div className="trait-bar" aria-hidden="true">
                <motion.i
                  initial={reduced ? false : { transform: 'scaleX(0)' }}
                  whileInView={{ transform: `scaleX(${Math.max(0.02, fill)})` }}
                  viewport={{ once: true, margin: '-15% 0px' }}
                  transition={{ duration: 0.9, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  style={{ transform: reduced ? `scaleX(${Math.max(0.02, fill)})` : undefined }}
                />
                <b style={{ left: `${trait.strong * 100}%` }} title={`Strong from ${percent(trait.strong)}`} />
              </div>
              <span className="trait-note">
                {describe[trait.key]}. Strong from {percent(trait.strong)}.
              </span>
            </li>
          );
        })}
      </ul>
      <p className="persona-foot">
        Each bar is the share of your orders. The mark is where a habit counts as strong. It compares you with nobody but yourself.
      </p>
    </section>
  );
}
