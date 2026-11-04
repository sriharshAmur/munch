import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import type { Overview } from '@core/analyze/overview';
import { DAY_START } from '@core/analyze/overview';
import { weekdays } from '@core/analyze/shared';
import { clock, date, day, euros, monthKey, number, oneIn, percent, plural } from '@/lib/format';
import { useFilters, type Search } from '@/lib/search';
import { Bars, type Bar } from '@/charts/Bars';
import { Interactive, Mark } from '@/charts/primitives';
import { useSeen } from '@/charts/useSeen';
import { Monogram } from '@/components/Monogram';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HomeNames } from '@/story/HomeNames';
import { Card } from './Card';

type Props = { o: Overview };
const hourOrder = Array.from({ length: 24 }, (_, i) => (i + DAY_START) % 24);
/** "November to April 2026", or "December 2025 to March 2026" across a new year. */
const monthRange = (first: string, last: string) => {
  const a = monthKey(first.slice(0, 7)),
    b = monthKey(last.slice(0, 7));
  if (a === b) return a;
  return first.slice(0, 4) === last.slice(0, 4) ? `${a.split(' ')[0]} to ${b}` : `${a} to ${b}`;
};
const inWindow = (h: number, start: number) => [start, (start + 1) % 24, (start + 2) % 24].includes(h);

export function WhenCard({ o }: Props) {
  const [mode, setMode] = useState<'hour' | 'day'>('hour');
  const w = o.window;
  const peakHour = hourOrder.reduce((best, h) => ((o.hours[h] ?? 0) > (o.hours[best] ?? 0) ? h : best), hourOrder[0] ?? 0);
  const hourBars: Bar[] = hourOrder.map((h) => {
    const v = o.hours[h] ?? 0;
    return {
      key: `h${h}`,
      value: v,
      title: `${clock(h * 60)} to ${clock((h + 1) * 60)}`,
      detail: `${plural(v, 'order')}, ${percent(v / Math.max(1, o.count))} of the total`,
      tick: h % 3 === 0 ? clock(h * 60).slice(0, 2) : '',
      lit: inWindow(h, w.hour),
      label: h === peakHour && v ? number(v) : undefined,
      search: { hour: h },
    };
  });
  const dayBars: Bar[] = weekdays.map((name, d) => {
    const v = o.days[d] ?? 0;
    return {
      key: name,
      value: v,
      title: `${name}s`,
      detail: `${plural(v, 'order')}, ${percent(v / Math.max(1, o.count))} of the total`,
      tick: name.slice(0, 3),
      lit: d === o.topDay,
      label: number(v),
      search: { weekday: d },
    };
  });
  const top = o.days[o.topDay] ?? 0,
    quiet = o.days[o.quietDay] ?? 0;
  return (
    <Card
      span={8}
      question="When do you order?"
      answer={
        mode === 'hour' ? (
          <>
            {clock(w.hour * 60)} to {clock(((w.hour + 3) % 24) * 60)}
          </>
        ) : (
          <>{weekdays[o.topDay]}s</>
        )
      }
      note={
        mode === 'hour'
          ? `${percent(w.share)} of your orders land in these three hours. The bars run from 05:00 to 05:00, so a late night stays with its evening.`
          : `${plural(top, 'order')} on ${weekdays[o.topDay]}s, against ${number(quiet)} on ${weekdays[o.quietDay]}s.`
      }
      tools={
        <ToggleGroup
          type="single"
          value={mode}
          aria-label="Show orders by"
          onValueChange={(v) => (v === 'hour' || v === 'day') && setMode(v)}
          className="segmented"
        >
          <ToggleGroupItem value="hour">By hour</ToggleGroupItem>
          <ToggleGroupItem value="day">By day</ToggleGroupItem>
        </ToggleGroup>
      }
      numbers={
        mode === 'hour'
          ? { headers: ['Hour', 'Orders'], rows: hourOrder.map((h) => [clock(h * 60), o.hours[h] ?? 0]) }
          : { headers: ['Day', 'Orders'], rows: weekdays.map((d, i) => [d, o.days[i] ?? 0]) }
      }
    >
      <div className="swap" key={mode}>
        <Bars bars={mode === 'hour' ? hourBars : dayBars} label={mode === 'hour' ? 'Orders by hour' : 'Orders by weekday'} gap={mode === 'hour' ? 3 : 10} height="fill" />
      </div>
    </Card>
  );
}

export function PlacesCard({ o }: Props) {
  const filters = useFilters();
  const top = o.places[0];
  if (!top) return null;
  const list = o.places.slice(0, 6);
  const topThree = o.places.slice(0, 3).reduce((s, p) => s + p.count, 0) / Math.max(1, o.count);
  return (
    <Card
      span={4}
      question="Where from?"
      answer={top.name}
      note={`${plural(top.count, 'order')}, ${oneIn(top.share)} of everything. Your top three take ${percent(topThree)}.`}
      numbers={{ headers: ['Restaurant', 'Orders'], rows: o.places.map((p) => [p.name, p.count]) }}
      foot={
        <Link className="card-link" to="/places" search={filters}>
          All {plural(o.places.length, 'restaurant')}
        </Link>
      }
    >
      <Ranks
        rows={list.map((p) => ({
          id: p.id,
          mono: p,
          name: p.name,
          sub: p.usual,
          value: p.count,
          to: '/places',
          search: { ...filters, place: p.id },
        }))}
      />
    </Card>
  );
}

export function DishesCard({ o }: Props) {
  const filters = useFilters();
  const top = o.dishes[0];
  if (!top || top.count < 2) return null;
  return (
    <Card
      span={4}
      question="What do you order most?"
      answer={top.name}
      note={`${plural(top.count, 'time')}, from ${top.restaurant}.`}
      numbers={{ headers: ['Dish', 'Restaurant', 'Times'], rows: o.dishes.map((d) => [d.name, d.restaurant, d.count]) }}
    >
      <Ranks
        rows={o.dishes.slice(0, 5).map((d) => ({
          id: d.restaurantId,
          mono: { id: d.restaurantId, name: d.restaurant },
          key: d.id,
          name: d.name,
          sub: d.restaurant,
          value: d.count,
          suffix: '×',
          to: '/orders',
          search: { ...filters, restaurant: d.restaurantId, q: d.name },
        }))}
      />
    </Card>
  );
}

type Rank = {
  id: string;
  /** The restaurant whose initials lead the row. */
  mono: { id: string; name: string };
  key?: string;
  name: string;
  sub?: string;
  value: number;
  suffix?: string;
  to: '/orders' | '/places';
  search: Search;
};
/** A ranked list: initials, a name, what it is known for, and a bar for the count. */
function Ranks({ rows }: { rows: Rank[] }) {
  const { ref, seen } = useSeen<HTMLOListElement>();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="ranks" ref={ref} data-seen={seen}>
      {rows.map((r, i) => (
        <li key={r.key ?? r.id} style={{ '--i': i } as CSSProperties}>
          <Link to={r.to} search={r.search}>
            <Monogram id={r.mono.id} name={r.mono.name} size={34} />
            <span className="rank-text">
              <strong>{r.name}</strong>
              {r.sub && <span>{r.sub}</span>}
            </span>
            <span className="rank-value">
              {number(r.value)}
              {r.suffix ?? ''}
            </span>
            <span className="rank-bar" aria-hidden="true">
              <i style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function WeeksCard({ o, homeName, homeSlot }: Props & { homeName: (k: string) => string; homeSlot: (k: string) => number }) {
  const many = o.homes.length > 1;
  const best = o.busiestWeek;
  const month = o.busiestMonth;
  let lastMonth = '';
  const bars: Bar[] = o.weeks.map((w, i) => {
    const m = w.start.slice(0, 7);
    // A tick on the first week that starts in a new month.
    const tick = m !== lastMonth ? monthKey(m).slice(0, 3) : '';
    lastMonth = m;
    return {
      key: w.start,
      value: w.count,
      title: `Week of ${day(w.start)}`,
      detail: w.count
        ? `${plural(w.count, 'order')}, ${euros(w.spend, true)}${many ? `, ${w.homes.map((h) => homeName(h.key)).join(' and ')}` : ''}`
        : 'No orders',
      tick: i === 0 && o.weeks.length > 1 && o.weeks[1]?.start.slice(0, 7) !== m ? '' : tick,
      label: best && w.start === best.start && w.count ? number(w.count) : undefined,
      lit: !many && best?.start === w.start,
      parts: many
        ? [...w.homes].sort((a, b) => homeSlot(a.key) - homeSlot(b.key)).map((h) => ({ value: h.count, slot: homeSlot(h.key) }))
        : undefined,
      search: { week: w.start },
    };
  });
  const gap = o.calendar.gap;
  return (
    <Card
      span={12}
      question="How did the year go?"
      answer={month ? <>Busiest in {monthKey(month.month).split(' ')[0]}</> : 'Week by week'}
      note={
        <>
          {month ? `${plural(month.count, 'order')} that month. ` : ''}
          {best ? `Your busiest week started ${day(best.start)}, with ${best.count}. ` : ''}
          {gap.days >= 10 ? `The quietest stretch was ${gap.days} days without an order, from ${date(gap.start)} to ${date(gap.end)}.` : ''}
        </>
      }
      numbers={{
        headers: ['Week of', 'Orders', 'Spend'],
        rows: o.weeks.map((w) => [day(w.start), w.count, euros(w.spend, true)]),
      }}
      foot={
        many ? (
          <ul className="legend" aria-label="Homes">
            {o.homes.map((h) => (
              <li key={h.key} style={{ '--slot': `var(--m-data-${homeSlot(h.key)})` } as CSSProperties}>
                <i aria-hidden="true" />
                <span className="legend-name" title={homeName(h.key)}>
                  {homeName(h.key)}
                </span>
                <span className="legend-count">{number(h.count)}</span>
              </li>
            ))}
          </ul>
        ) : undefined
      }
    >
      <Bars bars={bars} label="Orders each week" gap={2} height={150} dense />
    </Card>
  );
}

export function CostCard({ o }: Props) {
  const c = o.cost;
  const at = c.bins.findIndex((b) => c.median >= b.from && (b.open || c.median < b.to));
  const busiest = c.bins.reduce((best, b, i) => (b.count > (c.bins[best]?.count ?? 0) ? i : best), 0);
  const bars: Bar[] = c.bins.map((b, i) => ({
    key: String(b.from),
    value: b.count,
    title: b.open ? `${euros(b.from, true)} or more` : `${euros(b.from, true)} to ${euros(b.to, true)}`,
    detail: plural(b.count, 'order'),
    tick: i % 2 === 0 ? (b.open ? `${euros(b.from, true)}+` : euros(b.from, true)) : '',
    lit: i === at,
    label: i === busiest && b.count ? number(b.count) : undefined,
    search: b.open ? { min: b.from } : { min: b.from, max: b.to },
  }));
  const m = c.money;
  const parts = [
    { key: 'Food', value: m.food - m.discount, slot: 1 },
    { key: 'Delivery', value: m.delivery, slot: 5 },
    { key: 'Service', value: m.service, slot: 2 },
    { key: 'Tips', value: m.tip, slot: 3 },
  ].filter((p) => p.value > 0);
  const whole = Math.max(1, parts.reduce((s, p) => s + p.value, 0));
  return (
    <Card
      span={4}
      question="What does an order cost?"
      answer={euros(c.median)}
      note={`Your usual order, half above and half below. ${percent(c.feeShare)} of the ${euros(m.total, true)} you paid went on fees.`}
      numbers={{
        headers: ['Order total', 'Orders'],
        rows: c.bins.map((b) => [b.open ? `${euros(b.from, true)} or more` : `${euros(b.from, true)} to ${euros(b.to, true)}`, b.count]),
      }}
    >
      <Bars bars={bars} label="Orders by total" gap={3} height={120} />
      <div className="split" aria-label="Where the money went">
        <div className="split-bar" aria-hidden="true">
          {parts.map((p) => (
            <i key={p.key} style={{ flexGrow: p.value, background: `var(--m-data-${p.slot})` } as CSSProperties} />
          ))}
        </div>
        <ul className="split-legend">
          {parts.map((p) => (
            <li key={p.key} style={{ '--slot': `var(--m-data-${p.slot})` } as CSSProperties}>
              <i aria-hidden="true" />
              {p.key} <b>{percent(p.value / whole)}</b>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function CompanyCard({ o }: Props) {
  const filters = useFilters();
  const c = o.company;
  const total = Math.max(1, c.solo + c.group);
  return (
    <Card
      span={4}
      question="On your own, or for a group?"
      answer={c.group ? `${oneIn(c.groupShare)} for a group` : 'Always on your own'}
      note={
        c.group
          ? `A group order comes to ${euros(c.groupAverage)}, against ${euros(c.soloAverage)} on your own${c.averageGroupSize ? `, for about ${Math.round(c.averageGroupSize)} people` : ''}.`
          : 'Not one group order in this view. Dinner for one, done well.'
      }
      numbers={{
        headers: ['', 'Orders', 'Average'],
        rows: [
          ['On your own', c.solo, euros(c.soloAverage)],
          ['Group', c.group, euros(c.groupAverage)],
        ],
      }}
    >
      <div className="company">
        <div className="company-bar" aria-hidden="true">
          <i style={{ flexGrow: c.solo }} data-slot="1" />
          {c.group > 0 && <i style={{ flexGrow: c.group }} data-slot="2" />}
        </div>
        <div className="company-stats">
          <Link to="/orders" search={{ ...filters, company: 'solo' }} style={{ '--slot': 'var(--m-data-1)' } as CSSProperties}>
            <span>On your own</span>
            <strong>{number(c.solo)}</strong>
            <em>{percent(c.solo / total)}</em>
          </Link>
          <Link to="/orders" search={{ ...filters, company: 'group' }} style={{ '--slot': 'var(--m-data-2)' } as CSSProperties}>
            <span>For a group</span>
            <strong>{number(c.group)}</strong>
            <em>{percent(c.group / total)}</em>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function CalendarCard({ o, span }: Props & { span: 8 | 12 }) {
  const { days, streak, gap } = o.calendar;
  const scroller = useRef<HTMLDivElement>(null);
  // Start at the latest week on a narrow screen.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days.length]);
  if (!days.length) return null;
  const first = days[0];
  const lead = first ? (new Date(`${first.date}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const cells = [...Array.from({ length: lead }, () => null), ...days];
  const weeks = Math.ceil(cells.length / 7);
  const level = (n: number) => (n === 0 ? 0 : n === 1 ? 2 : n === 2 ? 3 : 4);
  const inRun = (d: string, run: { start: string; end: string; days: number }) => run.days > 1 && d >= run.start && d <= run.end;
  const months: { col: number; label: string }[] = [];
  cells.forEach((c, i) => {
    if (c && c.date.endsWith('-01')) months.push({ col: Math.floor(i / 7), label: monthKey(c.date.slice(0, 7)).slice(0, 3) });
  });
  return (
    <Card
      span={span}
      question="Which days did you order?"
      answer={streak.days > 1 ? `${streak.days} days in a row` : 'Never two days running'}
      note={
        <>
          {streak.days > 1 ? `Your longest run, ending ${date(streak.end, true)}. ` : ''}
          {gap.days > 1 ? `The longest break was ${gap.days} days, from ${date(gap.start)} to ${date(gap.end)}.` : ''}
        </>
      }
      numbers={{
        headers: ['Day', 'Orders'],
        rows: days.filter((d) => d.count).map((d) => [date(d.date), d.count]),
      }}
      foot={
        <div className="cal-key" aria-hidden="true">
          <span>None</span>
          {[0, 2, 3, 4].map((l) => (
            <i key={l} data-level={l} />
          ))}
          <span>3 or more</span>
          <span className="cal-key-run">
            <i data-run="true" /> Longest run
          </span>
        </div>
      }
    >
      <div className="cal-scroll" ref={scroller}>
        <div className="cal" style={{ '--weeks': weeks } as CSSProperties}>
          <div className="cal-months" aria-hidden="true">
            {months.map((m) => (
              <span key={m.col} style={{ gridColumn: m.col + 1 }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="cal-days" aria-hidden="true">
            {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <Interactive>
            <div className="cal-grid" role="group" aria-label="Every day, one square each">
              {cells.map((c, i) =>
                c ? (
                  <Mark
                    key={c.date}
                    index={i}
                    title={date(c.date, true)}
                    detail={c.count ? plural(c.count, 'order') : 'No orders'}
                    search={{ date: c.date }}
                  >
                    <span className="cal-cell" data-level={level(c.count)} data-run={inRun(c.date, streak)} />
                  </Mark>
                ) : (
                  <span key={`x${i}`} />
                ),
              )}
            </div>
          </Interactive>
        </div>
      </div>
    </Card>
  );
}

export function HomesCard({ o, homeName, homeSlot }: Props & { homeName: (k: string) => string; homeSlot: (k: string) => number }) {
  const filters = useFilters();
  if (o.homes.length < 2) return null;
  const max = Math.max(1, ...o.homes.map((h) => h.count));
  const wide = o.homes.length > 3;
  return (
    <Card
      span={wide ? 12 : 4}
      question="Where were you living?"
      answer={plural(o.homes.length, 'home')}
      note="Each home has its own usual. Your file keeps only the area, never the street."
      numbers={{
        headers: ['Home', 'City', 'Orders', 'From', 'To'],
        rows: o.homes.map((h) => [homeName(h.key), h.city, h.count, date(h.first, true), date(h.last, true)]),
      }}
      foot={<HomeNames keys={o.homes.map((h) => h.key)} />}
    >
      <ul className="homes" data-wide={wide}>
        {o.homes.map((h) => (
          <li key={h.key} style={{ '--slot': `var(--m-data-${homeSlot(h.key)})` } as CSSProperties}>
            <Link to="/" search={{ ...filters, home: h.key }}>
              <span className="home-top">
                <i aria-hidden="true" />
                <strong title={homeName(h.key)}>{homeName(h.key)}</strong>
                <span className="home-count">{number(h.count)}</span>
              </span>
              <span className="home-meta">
                {h.city}, {monthRange(h.first, h.last)}
                {h.top ? `. Mostly ${h.top}` : ''}
              </span>
              <span className="home-bar" aria-hidden="true">
                <b style={{ width: `${(h.count / max) * 100}%` }} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
