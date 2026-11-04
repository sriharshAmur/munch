import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Pause, Play, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { Order } from '@core/schema';
import { recap, storyPeriods, type Period, type Recap } from '@core/analyze/recap';
import { weekdays } from '@core/analyze/shared';
import { clock, euros, month as monthOf, plural } from '@/lib/format';
import { useData } from '@/data/provider';
import { CountUp } from '@/story/CountUp';
import { types } from '@/story/Persona';
import { useReducedMotion } from '@/story/palette';

type Theme = 'night' | 'lamp' | 'violet' | 'leaf' | 'ember';
type Slide = { key: string; theme: Theme; body: ReactNode };
const themes: Theme[] = ['violet', 'lamp', 'leaf', 'ember', 'night'];

const list: Variants = { show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } };
const item: Variants = {
  hide: { opacity: 0, transform: 'translateY(28px)' },
  show: { opacity: 1, transform: 'translateY(0px)', transition: { type: 'spring', duration: 0.7, bounce: 0.2 } },
};
const M = motion.div;

/** "this month", "this year": how a slide refers to its own story. */
const within = (r: Recap) => (r.kind === 'month' ? `in ${r.label}` : r.kind === 'year' ? `in ${r.label}` : 'this year');

function slides(r: Recap, reduced: boolean, actions: ReactNode): Slide[] {
  const top = r.places[0];
  const max = Math.max(1, ...r.buckets.map((b) => b.count));
  const difference = r.count - r.previous;
  const span = `${monthOf(r.first)} to ${monthOf(r.last)}`;
  const big = r.kind === 'all' ? 'Your year' : r.label;
  const out: Slide[] = [
    {
      key: 'intro',
      theme: 'night',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            {r.kind === 'all' ? span : r.kind === 'month' ? `${r.title}, in orders` : 'Your year in orders'}
          </M>
          <M variants={item} className="ys-year" data-long={big.length > 5} aria-label={big}>
            {big.split('').map((d, i) => (
              <motion.span
                key={i}
                initial={reduced ? false : { transform: 'translateY(60%)', opacity: 0 }}
                animate={{ transform: 'translateY(0%)', opacity: 1 }}
                transition={{ type: 'spring', duration: 0.9, bounce: 0.25, delay: 0.15 + i * 0.05 }}
                aria-hidden="true"
              >
                {d === ' ' ? ' ' : d}
              </motion.span>
            ))}
          </M>
          <M variants={item} className="ys-hint">
            Tap the right side to go on, the left to go back. Hold to pause.
          </M>
        </>
      ),
    },
    {
      key: 'count',
      theme: 'lamp',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            {r.kind === 'month' ? `In ${r.label} you ordered` : 'You ordered'}
          </M>
          <M variants={item} className="ys-huge">
            <CountUp value={r.count} reduced={reduced} duration={1.4} />
          </M>
          <M variants={item} className="ys-big">
            {r.count === 1 ? 'time.' : 'times.'}
          </M>
          <M variants={item} className="ys-line">
            {r.count > 1 ? `One order every ${r.everyDays.toFixed(1)} days, ${euros(r.spend, true)} in all. ` : `${euros(r.spend, true)}. `}
            {r.previousLabel && r.previous
              ? difference === 0
                ? `Exactly as many as in ${r.previousLabel}.`
                : `${Math.abs(difference)} ${difference > 0 ? 'more' : 'fewer'} than in ${r.previousLabel}.`
              : ''}
          </M>
        </>
      ),
    },
  ];
  if (top)
    out.push({
      key: 'places',
      theme: 'violet',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            Your number one {r.kind === 'month' ? `in ${r.label}` : ''}
          </M>
          <M variants={item} className="ys-name">
            {top.name}
          </M>
          <M variants={item} className="ys-line">
            {plural(top.count, 'order')}
            {top.usual ? `, usually the ${top.usual.toLowerCase()}` : ''}.
          </M>
          {r.places.length > 1 && (
            <M variants={list} className="ys-ranks">
              {r.places.slice(1).map((p, i) => (
                <M variants={item} key={p.id} className="ys-rank">
                  <span>{i + 2}</span>
                  <strong>{p.name}</strong>
                  <em>{p.count}</em>
                  <i style={{ width: `${(p.count / top.count) * 100}%` }} />
                </M>
              ))}
            </M>
          )}
        </>
      ),
    });
  if (r.dish && r.dish.count >= 2)
    out.push({
      key: 'dish',
      theme: 'ember',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            Dish of the {r.kind === 'month' ? 'month' : 'year'}
          </M>
          <M variants={item} className="ys-name">
            {r.dish.name}
          </M>
          <M variants={item} className="ys-line">
            {r.dish.count} times, from {r.dish.restaurant}.
          </M>
        </>
      ),
    });
  if (r.count >= 3)
    out.push({
      key: 'when',
      theme: 'leaf',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            Peak hunger
          </M>
          <M variants={item} className="ys-name">
            {weekdays[r.peak.weekday]}s around {clock(r.peak.hour * 60)}
          </M>
          <M variants={item} className="ys-months" data-few={r.buckets.length <= 7} aria-hidden="true">
            {r.buckets.map((b, i) => (
              <div key={i} data-lit={b === r.busiest}>
                <motion.i
                  initial={reduced ? false : { transform: 'scaleY(0)' }}
                  animate={{ transform: `scaleY(${Math.max(0.03, b.count / max)})` }}
                  transition={{ type: 'spring', duration: 0.8, bounce: 0.15, delay: 0.35 + i * 0.04 }}
                />
                <span>{b.short}</span>
              </div>
            ))}
          </M>
          <M variants={item} className="ys-line">
            {r.kind === 'month'
              ? `${r.busiest.label} were the busiest, with ${plural(r.busiest.count, 'order')}.`
              : `${r.busiest.label.split(' ')[0]} was your busiest month, with ${plural(r.busiest.count, 'order')}.`}
          </M>
        </>
      ),
    });
  if (r.kind === 'all')
    out.push({
      key: 'tried',
      theme: 'night',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            Restaurants
          </M>
          <M variants={item} className="ys-huge">
            <CountUp value={r.restaurants} reduced={reduced} duration={1} />
          </M>
          <M variants={item} className="ys-big">
            {r.restaurants === 1 ? 'place' : 'places'}
          </M>
          <M variants={item} className="ys-line">
            {r.oneTimers
              ? `${r.oneTimers} of them got exactly one try. The rest earned a second.`
              : 'Every one of them got a second order. You chose well.'}
          </M>
        </>
      ),
    });
  else
    out.push({
      key: 'new',
      theme: 'night',
      body: r.newPlaces ? (
        <>
          <M variants={item} className="ys-kicker">
            New to you
          </M>
          <M variants={item} className="ys-huge">
            <CountUp value={r.newPlaces} reduced={reduced} duration={1} />
          </M>
          <M variants={item} className="ys-big">
            {r.newPlaces === 1 ? 'new place' : 'new places'}
          </M>
          <M variants={item} className="ys-line">
            out of the {plural(r.restaurants, 'restaurant')} you ordered from {within(r)}.
          </M>
        </>
      ) : (
        <>
          <M variants={item} className="ys-kicker">
            New to you
          </M>
          <M variants={item} className="ys-name">
            Nowhere new.
          </M>
          <M variants={item} className="ys-line">
            All {plural(r.restaurants, 'restaurant')} were places you already knew. You knew what you liked.
          </M>
        </>
      ),
    });
  if (r.persona)
    out.push({
      key: 'type',
      theme: 'lamp',
      body: (
        <>
          <M variants={item} className="ys-kicker">
            {r.kind === 'all' ? 'This year, you were' : `In ${r.label}, you were`}
          </M>
          <M variants={item} className="ys-name">
            {types[r.persona.type].name}.
          </M>
          <M variants={item} className="ys-line">
            {types[r.persona.type].line(r.persona.traits[0]?.share ?? 0, r.persona.clockwork)}
          </M>
        </>
      ),
    });
  out.push({
    key: 'end',
    theme: 'violet',
    body: (
      <>
        <M variants={item} className="ys-kicker">
          {plural(r.count, 'order')}, {euros(r.spend, true)}, {plural(r.restaurants, 'restaurant')}
        </M>
        <M variants={item} className="ys-name">
          That was {r.kind === 'all' ? 'your year' : r.label}.
        </M>
        <M variants={item} className="ys-actions">
          {actions}
        </M>
      </>
    ),
  });
  return out;
}

function Player({
  history,
  period,
  next,
  onPeriod,
  onClose,
}: {
  history: Order[];
  period: Period;
  next: Recap | null;
  onPeriod: (p: Period) => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const r = useMemo(() => recap(history, period), [history, period]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    setIndex(0);
    setPaused(false);
  }, [period]);
  if (!r) return null;
  const deck = slides(
    r,
    reduced,
    <>
      {next && (
        <button type="button" className="ys-button primary" onClick={() => onPeriod(next.period)}>
          Play {next.kind === 'all' ? 'your year' : next.label}
        </button>
      )}
      <button
        type="button"
        className="ys-button"
        onClick={() => {
          onClose();
          void navigate({ to: '/orders', search: r.kind === 'month' ? { month: String(r.period) } : r.kind === 'year' ? { year: Number(r.period) } : {} });
        }}
      >
        See {r.kind === 'all' ? 'every order' : `the orders from ${r.label}`}
      </button>
      <button type="button" className="ys-button" onClick={() => setIndex(0)}>
        Play again
      </button>
    </>,
  );
  const last = deck.length - 1;
  const slide = deck[Math.min(index, last)];
  if (!slide) return null;
  // Past the last slide, the next story starts, like flicking to the next person's story.
  const go = (step: number) => {
    if (step > 0 && index >= last && next) {
      onPeriod(next.period);
      return;
    }
    setIndex((i) => Math.max(0, Math.min(last, i + step)));
  };
  const running = !paused && !held && !reduced && index < last;
  return (
    <div
      className="ys"
      data-theme-stage={slide.theme}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
          e.preventDefault();
          setPaused((p) => !p);
        }
      }}
    >
      <div className="ys-progress" aria-hidden="true">
        {deck.map((s, i) => (
          <span key={s.key}>
            <i
              key={i === index ? `${String(period)}-${index}` : undefined}
              data-state={i < index ? 'done' : i === index ? (reduced ? 'done' : 'now') : 'next'}
              style={{ animationPlayState: running ? 'running' : 'paused' }}
              onAnimationEnd={() => i === index && go(1)}
            />
          </span>
        ))}
      </div>
      <div className="ys-top">
        <span>{r.kind === 'all' ? 'Your year' : r.title}</span>
        <div>
          {!reduced && (
            <button type="button" aria-label={paused ? 'Play' : 'Pause'} onClick={() => setPaused(!paused)}>
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
          )}
          <Dialog.Close asChild>
            <button type="button" aria-label="Close the story">
              <X aria-hidden="true" />
            </button>
          </Dialog.Close>
        </div>
      </div>
      <div
        className="ys-tap"
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1);
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${String(period)}-${slide.key}`}
            className="ys-slide"
            initial="hide"
            animate="show"
            exit={{ opacity: 0, transform: 'translateY(-16px)', transition: { duration: 0.16 } }}
            variants={list}
            aria-live="polite"
          >
            {slide.body}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="ys-nav">
        <button type="button" onClick={() => go(-1)} disabled={index === 0}>
          Back
        </button>
        <span>
          {index + 1} of {deck.length}
        </span>
        <button type="button" onClick={() => go(1)} disabled={index === last && !next}>
          {index === last && next ? `Next: ${next.kind === 'all' ? 'your year' : next.label}` : 'Next'}
        </button>
      </div>
    </div>
  );
}

const seenKey = 'munch-stories-seen';
function useSeenStories(source: string) {
  const [seen, setSeen] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(seenKey) ?? '[]') as string[]);
    } catch {
      return new Set<string>();
    }
  });
  const mark = (id: string) =>
    setSeen((s) => {
      const next = new Set(s).add(`${source}:${id}`);
      localStorage.setItem(seenKey, JSON.stringify([...next].slice(-200)));
      return next;
    });
  return { has: (id: string) => seen.has(`${source}:${id}`), mark };
}

/** Story rings: your whole year first, then each month, newest first. Watched ones go quiet. */
export function Stories({ history }: { history: Order[] }) {
  const { state } = useData();
  const source = state.kind === 'ready' ? (state.demo ? 'demo' : 'local') : 'none';
  const recaps = useMemo(
    () => (['all', ...storyPeriods(history)] as Period[]).flatMap((p) => recap(history, p) ?? []),
    [history],
  );
  const [open, setOpen] = useState<Period | null>(null);
  const seen = useSeenStories(source);
  const reduced = useReducedMotion();
  if (!recaps.length) return null;
  const id = (r: Recap) => `${String(r.period)}:${r.count}`;
  const play = (p: Period) => {
    const r = recaps.find((v) => v.period === p);
    if (r) seen.mark(id(r));
    setOpen(p);
  };
  const at = recaps.findIndex((r) => r.period === open);
  const next = at >= 0 ? (recaps[at + 1] ?? null) : null;
  return (
    <nav className="rings" aria-label="Stories">
      <ul>
        {recaps.map((r, i) => (
          <motion.li
            key={String(r.period)}
            initial={reduced ? false : { opacity: 0, transform: 'scale(0.85)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.25, delay: Math.min(i, 10) * 0.035 }}
          >
            <button
              type="button"
              className="story-ring"
              data-seen={seen.has(id(r))}
              data-kind={r.kind}
              onClick={() => play(r.period)}
              aria-label={`Play ${r.kind === 'all' ? 'your year' : r.title}: ${plural(r.count, 'order')}${seen.has(id(r)) ? ', watched' : ''}`}
            >
              <span className="ring-face" data-theme-stage={r.kind === 'all' ? 'lamp' : themes[i % themes.length]}>
                {r.kind === 'all' ? (
                  <>
                    <b>{r.count}</b>
                    <small>orders</small>
                  </>
                ) : (
                  <b>{r.label.slice(0, 3)}</b>
                )}
              </span>
              <span className="ring-label">{r.kind === 'all' ? 'Your year' : r.label}</span>
              <span className="ring-count">{r.kind === 'all' ? `${monthOf(r.first).slice(0, 3)} to ${monthOf(r.last).slice(0, 3)}` : plural(r.count, 'order')}</span>
            </button>
          </motion.li>
        ))}
      </ul>
      <Dialog.Root open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="ys-overlay" />
          <Dialog.Content className="ys-content" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{recaps[at]?.title ?? 'Your story'}</Dialog.Title>
            {open !== null && <Player history={history} period={open} next={next} onPeriod={play} onClose={() => setOpen(null)} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </nav>
  );
}
