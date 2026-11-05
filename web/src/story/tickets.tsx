import type { CSSProperties, ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import type { Order } from '@core/schema';
import type { Finding } from '@core/analyze/noticed';
import { DAY, local, weekdays } from '@core/analyze/shared';
import { clock, date, euros, month, number, percent, plural } from '@/lib/format';
import type { Search } from '@/lib/search';

export type Ticket = {
  key: string;
  title: string;
  value: ReactNode;
  text: ReactNode;
  art?: ReactNode;
  link?: { label: string; search: Search };
};


function Week({ lit }: { lit: number }) {
  return (
    <div className="art-week" aria-hidden="true">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
        <span key={i} data-lit={i === lit}>
          {d}
        </span>
      ))}
    </div>
  );
}

function Visits({ orders, id, now }: { orders: Order[]; id: string; now: string }) {
  const visits = orders.filter((o) => o.restaurant.id === id).map((o) => Date.parse(o.placedAt));
  const first = visits[0] ?? 0,
    end = Date.parse(now);
  const x = (t: number) => ((t - first) / Math.max(DAY, end - first)) * 100;
  return (
    <svg className="art-visits" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2="100" y1="10" y2="10" />
      {visits.map((t, i) => (
        <rect key={i} x={x(t) - 0.4} y="3" width="0.8" height="14" />
      ))}
      <circle cx="99" cy="10" r="2.2" />
    </svg>
  );
}

function Bars({ values, lit }: { values: number[]; lit: (i: number) => boolean }) {
  const max = Math.max(1, ...values);
  return (
    <div className="art-bars" aria-hidden="true">
      {values.map((v, i) => (
        <i key={i} data-lit={lit(i)} style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

function Clock({ minutes }: { minutes: number }) {
  const angle = ((minutes % 720) / 720) * 360;
  return (
    <svg className="art-clock" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" />
      <line x1="20" y1="20" x2="20" y2="7" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '20px 20px' }} />
      <line x1="20" y1="20" x2="20" y2="11" style={{ transform: `rotate(${(minutes / 60 / 12) * 360}deg)`, transformOrigin: '20px 20px' }} />
    </svg>
  );
}

export function tickets(found: Finding[], orders: Order[], now: string, homeName: (key: string) => string): Ticket[] {
  const out: Ticket[] = [];
  for (const f of found)
    switch (f.kind) {
      case 'inflation':
        out.push({
          key: f.kind,
          title: 'Your own inflation',
          value: `+${percent(f.change)}`,
          text: (
            <>
              The {f.dish.toLowerCase()} at {f.restaurant} was {euros(f.first.price)} in {month(f.first.at)} and{' '}
              {euros(f.last.price)} by {month(f.last.at)}. You ordered it {f.times} times anyway.
            </>
          ),
          art: (
            <div className="art-prices" aria-hidden="true">
              <span>{euros(f.first.price)}</span>
              <i />
              <span>{euros(f.last.price)}</span>
            </div>
          ),
          link: { label: `See ${f.restaurant}`, search: { restaurant: f.restaurantId } },
        });
        break;
      case 'ghosted':
        out.push({
          key: f.kind,
          title: 'Gone quiet',
          value: `${number(f.daysSince)} days`,
          text: (
            <>
              since your last order from {f.restaurant}. You used to order every {plural(f.usualGap, 'day')}, {f.count}{' '}
              times in all, and you still live in delivery range.
            </>
          ),
          art: <Visits orders={orders} id={f.restaurantId} now={now} />,
          link: { label: `See ${f.restaurant}`, search: { restaurant: f.restaurantId } },
        });
        break;
      case 'ritual':
        out.push({
          key: f.kind,
          title: 'A ritual',
          value: `${weekdays[f.weekday]} ${f.part === 'late' ? 'late' : f.part}`,
          text: (
            <>
              means {f.restaurant}. {f.count} times, {f.share >= 0.99 ? 'and never on any other day' : `${percent(f.share)} of every order you placed there`}.
            </>
          ),
          art: <Week lit={f.weekday} />,
          link: { label: `See ${f.restaurant}`, search: { restaurant: f.restaurantId, weekday: f.weekday } },
        });
        break;
      case 'moving-in': {
        const where = (m: (typeof f.moves)[number]) => {
          const name = homeName(m.home);
          return name.includes(m.city) ? name : `${name}, ${m.city}`;
        };
        const shown = f.moves.slice(-3);
        out.push({
          key: f.kind,
          title: 'Moving-in dinners',
          value: f.moves.length === 1 ? (f.moves[0]?.city ?? '') : `${f.moves.length} moves`,
          text: (
            <>
              {f.moves.length > shown.length && (
                <span className="move">The last {shown.length}:</span>
              )}
              {shown.map((m) => (
                <span key={m.home} className="move">
                  {m.daysAfter !== null && m.daysAfter <= 3
                    ? `First night at ${where(m)}: ${m.restaurant}.`
                    : `First order at ${where(m)}: ${m.restaurant}, ${date(m.at, true)}.`}
                </span>
              ))}
            </>
          ),
        });
        break;
      }
      case 'late':
        out.push({
          key: f.kind,
          title: 'Your latest night',
          value: clock(f.minutes),
          text: (
            <>
              {f.order.items[0]?.name ?? 'An order'} from {f.order.restaurant.name}, on {date(f.order.placedAt, true)}.
            </>
          ),
          art: <Clock minutes={f.minutes} />,
          link: { label: 'Open the order', search: { order: f.order.id } },
        });
        break;
      case 'one-timers':
        out.push({
          key: f.kind,
          title: 'One and done',
          value: number(f.count),
          text: <>restaurants got exactly one order from you, out of {f.restaurants}. Tried, and moved on.</>,
          art: (
            <div className="art-dots" aria-hidden="true">
              {Array.from({ length: Math.min(60, f.restaurants) }, (_, i) => (
                <i key={i} data-lit={i < Math.round((f.count / f.restaurants) * Math.min(60, f.restaurants))} />
              ))}
            </div>
          ),
        });
        break;
      case 'payday': {
        const byDay = Array.from({ length: 31 }, (_, d) => orders.filter((o) => local(o.placedAt).day === d + 1).length);
        out.push({
          key: f.kind,
          title: 'Payday',
          value: more(f.ratio),
          text: <>orders a day from the 25th to the end of the month than in the rest of it.</>,
          art: <Bars values={byDay} lit={(i) => i >= 24} />,
        });
        break;
      }
      case 'word':
        out.push({
          key: f.kind,
          title: 'The word that keeps coming up',
          value: f.word,
          text: <>is in {plural(f.count, 'order')}. More than any other word on your receipts.</>,
        });
        break;
      case 'customiser':
        out.push({
          key: f.kind,
          title: 'Your way',
          value: `“${f.option}”`,
          text: (
            <>
              {f.times} times. You changed something in {percent(f.share)} of your orders.
            </>
          ),
        });
        break;
      case 'biggest':
        out.push({
          key: f.kind,
          title: 'The big one',
          value: euros(f.order.money.total),
          text: (
            <>
              at {f.order.restaurant.name} on {date(f.order.placedAt, true)}
              {f.order.group.isGroup && f.order.group.groupSize ? `, for ${f.order.group.groupSize} people` : ''}. Your
              typical order is {euros(f.typical)}.
            </>
          ),
          link: { label: 'Open the order', search: { order: f.order.id } },
        });
        break;
      case 'streak':
        out.push({
          key: f.kind,
          title: 'On a roll',
          value: `${f.days} days`,
          text: <>in a row with an order, ending {date(f.end, true)}.</>,
          art: (
            <div className="art-run" aria-hidden="true">
              {Array.from({ length: Math.min(14, f.days) }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          ),
          link: { label: 'See those days', search: { month: f.end.slice(0, 7) } },
        });
        break;
      case 'drought':
        out.push({
          key: f.kind,
          title: 'The long break',
          value: `${f.days} days`,
          text: (
            <>
              without a single order, from {date(f.start, true)} to {date(f.end, true)}. A holiday, or a very full
              fridge.
            </>
          ),
        });
        break;
      case 'tipping':
        out.push({
          key: f.kind,
          title: 'Since ' + f.year,
          value: percent(f.after),
          text: (
            <>
              of your orders include a tip, up from {percent(f.before)} before {f.year}.
            </>
          ),
          art: <Bars values={[f.before, f.after]} lit={(i) => i === 1} />,
        });
        break;
      case 'delivery-time':
        out.push({
          key: f.kind,
          title: 'The wait',
          value: `${f.median} min`,
          text: (
            <>
              from order to doorstep, usually.
              {f.fastest ? ` ${f.fastest.restaurant} is quickest, at about ${f.fastest.minutes} minutes.` : ''}
            </>
          ),
        });
        break;
      case 'quiet-day':
        out.push({
          key: f.kind,
          title: 'The quiet day',
          value: weekdays[f.weekday] ?? '',
          text: (
            <>
              only {plural(f.count, 'order')}, against {number(f.busiestCount)} on a {weekdays[f.busiest]}.
            </>
          ),
          art: <Week lit={f.weekday} />,
        });
        break;
      case 'same-basket':
        out.push({
          key: f.kind,
          title: 'Again, please',
          value: percent(f.share),
          text: (
            <>
              of your orders were a basket you had ordered before, exactly. One at {f.restaurant}, {f.times} times.
            </>
          ),
        });
        break;
      case 'fees':
        out.push({
          key: f.kind,
          title: 'Fees',
          value: percent(f.share),
          text: (
            <>
              of what you paid, {euros(f.fees, true)} in all, went on delivery, service and small-order fees.
            </>
          ),
          art: (
            <div className="art-split" aria-hidden="true">
              <i style={{ width: `${Math.max(2, f.share * 100)}%` }} />
            </div>
          ),
        });
        break;
    }
  return out;
}
/** One ticket, hanging slightly crooked from its pin. */
export function TicketCard({ ticket: t, tilt, search }: { ticket: Ticket; tilt: number; search?: Search }) {
  return (
    <article className="ticket" style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      <span className="ticket-pin" aria-hidden="true" />
      <h3>{t.title}</h3>
      <p className="ticket-value" data-long={typeof t.value === 'string' && t.value.length > 8}>
        {t.value}
      </p>
      <p className="ticket-text">{t.text}</p>
      {t.art && <div className="ticket-art">{t.art}</div>}
      {t.link && search && (
        <Link className="ticket-link" to="/orders" search={{ ...search, ...t.link.search }}>
          {t.link.label}
        </Link>
      )}
    </article>
  );
}
const more = (ratio: number) => `+${Math.round((ratio - 1) * 100)}%`;
