import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import type { Order } from '@core/schema';
import { backtest, predict } from '@core/predict';
import { weekdays } from '@core/analyze/shared';
import { clock, date } from '@/lib/format';
import { useFilters } from '@/lib/search';
import { useReducedMotion } from './palette';

export function Guess({ orders, now }: { orders: Order[]; now: string }) {
  const result = useMemo(() => predict(orders, now), [orders, now]);
  const filters = useFilters();
  const reduced = useReducedMotion();
  const [score, setScore] = useState<ReturnType<typeof backtest> | null>(null);
  useEffect(() => {
    setScore(null);
    // Replaying a hundred past guesses takes a moment; let the page settle first.
    const timer = window.setTimeout(() => setScore(backtest(orders)), 400);
    return () => window.clearTimeout(timer);
  }, [orders]);
  const winner = result?.restaurants[0];
  if (!result || !winner)
    return (
      <section className="guess" aria-labelledby="guess-title">
        <h2 id="guess-title" className="section-title">
          Your next order
        </h2>
        <p className="section-lede">Ten or more orders in this view, and there'll be a guess here.</p>
      </section>
    );
  const hits = score ? Math.round(score.top1Rate * 10) : 0;
  return (
    <section className="guess" aria-labelledby="guess-title">
      <div className="guess-copy">
        <h2 id="guess-title" className="section-title">
          Your next order
        </h2>
        <p className="guess-line">
          Probably <strong>{weekdays[result.window.weekday]}</strong>, around{' '}
          <strong>{clock(result.window.hour * 60)}</strong>, from <strong>{winner.name}</strong>.
        </p>
        <p className="section-lede">
          {date(result.window.time, true)}, if the pattern holds. If not, {result.restaurants
            .slice(1, 3)
            .map((r) => r.name)
            .join(' or ')}
          .
        </p>
      </div>
      <div className="guess-score">
        <div className="hit-dots" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <motion.i
              key={i}
              data-hit={score !== null && i < hits}
              initial={reduced ? false : { opacity: 0, transform: 'scale(0.6)' }}
              whileInView={{ opacity: 1, transform: 'scale(1)' }}
              viewport={{ once: true }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
        {score ? (
          <p>
            Asked the same question before each of your last {score.tested} orders, this guess named the right place{' '}
            {score.top1} times, about {hits} in 10.{' '}
            {score.top1Rate < 0.5
              ? 'It misses more often than not, so treat it as a nudge, not a reservation.'
              : 'You are easy to read. You can still surprise it.'}
          </p>
        ) : (
          <p>Checking how often this would have been right…</p>
        )}
        <Link className="ticket-link" to="/orders" search={{ ...filters, restaurant: winner.id }}>
          See your orders from {winner.name}
        </Link>
      </div>
    </section>
  );
}
