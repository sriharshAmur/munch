import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Delaunay } from 'd3-delaunay';
import { scaleLinear } from 'd3-scale';
import { Pause, Play, Shuffle } from 'lucide-react';
import { local, sorted } from '@core/analyze/shared';
import type { Order } from '@core/schema';
import { date, euros, number, plural } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartTooltip, Figure, hrefFor, useSize } from './primitives';
import { useFilters } from '@/lib/search';

type Lens = 'all' | 'usual' | 'late';
const clock = (order: Order) => {
  const p = local(order.placedAt);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
};

export function Plate({
  orders,
  children,
}: {
  orders: Order[];
  children: ReactNode;
}) {
  const { ref, width } = useSize(),
    filters = useFilters();
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [lens, setLens] = useState<Lens>('all');
  const [cursor, setCursor] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [animate, setAnimate] = useState(
    () => !sessionStorage.getItem('munch-plate-filled') && !reduced,
  );
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(query.matches);
      if (query.matches) {
        setPlaying(false);
        setAnimate(false);
      }
    };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    sessionStorage.setItem('munch-plate-filled', 'true');
    if (!animate) return;
    const timer = window.setTimeout(() => setAnimate(false), 2400);
    return () => window.clearTimeout(timer);
  }, [animate]);
  const data = useMemo(() => {
    const rows = sorted(orders),
      first = Date.parse(rows[0]?.placedAt ?? '2000-01-01'),
      last = Date.parse(rows.at(-1)?.placedAt ?? '2000-01-02'),
      radius = scaleLinear()
        .domain([first, last === first ? first + 1 : last])
        .range([90, 437]);
    const counts = new Map<string, number>();
    const dots = rows.map((order) => {
      counts.set(
        order.restaurant.id,
        (counts.get(order.restaurant.id) ?? 0) + 1,
      );
      const p = local(order.placedAt),
        angle = ((p.hour * 60 + p.minute) / 1440) * Math.PI * 2 - Math.PI / 2,
        r = radius(Date.parse(order.placedAt));
      return {
        order,
        x: 500 + Math.cos(angle) * r,
        y: 500 + Math.sin(angle) * r,
        angle,
      };
    });
    const usual = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    const years = [];
    for (
      let year = new Date(first).getUTCFullYear() + 1;
      year <= new Date(last).getUTCFullYear();
      year++
    )
      years.push({
        year,
        r: radius(Date.parse(`${year}-01-01T00:00:00+01:00`)),
      });
    return { dots, years, usual };
  }, [orders]);
  const total = data.dots.length,
    shown = Math.min(cursor ?? total, total);
  useEffect(() => {
    if (!playing || reduced || !total) return;
    if (shown >= total) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () =>
        setCursor(Math.min(shown + Math.max(1, Math.ceil(total / 100)), total)),
      80,
    );
    return () => window.clearTimeout(timer);
  }, [playing, reduced, shown, total]);
  const visible = useMemo(() => data.dots.slice(0, shown), [data, shown]);
  const delaunay = useMemo(
    () =>
      Delaunay.from(
        visible,
        (d) => d.x,
        (d) => d.y,
      ),
    [visible],
  );
  const matches = (order: Order) =>
    lens === 'all' ||
    (lens === 'usual'
      ? order.restaurant.id === data.usual
      : local(order.placedAt).hour >= 22 || local(order.placedAt).hour < 6);
  const matching = visible.filter((d) => matches(d.order));
  const selectedIndex = active ?? (cursor !== null ? shown - 1 : pinned);
  const selected = selectedIndex === null ? undefined : visible[selectedIndex];
  const receipt = selected ?? visible.at(-1);
  const dot = active === null ? undefined : visible[active];
  const labelSize = (13 * 1000) / Math.max(width, 300);
  function nearest(element: SVGSVGElement, clientX: number, clientY: number) {
    if (!visible.length) return null;
    const box = element.getBoundingClientRect(),
      x = ((clientX - box.x) / box.width) * 1000,
      y = ((clientY - box.y) / box.height) * 1000,
      index = delaunay.find(x, y),
      point = visible[index];
    return point &&
      Math.hypot(x - point.x, y - point.y) < Math.max(35, 22000 / box.width)
      ? index
      : null;
  }
  function stop() {
    setPlaying(false);
    setAnimate(false);
    setActive(null);
  }
  return (
    <section className="story-hero" data-playing={playing} data-lens={lens}>
      <div className="hero-copy">
        {children}
        <div className="plate-controls">
          <ToggleGroup
            type="single"
            value={lens}
            aria-label="Spotlight a dinner habit"
            onValueChange={(value) => {
              if (value === 'all' || value === 'usual' || value === 'late') {
                stop();
                setCursor(null);
                setPinned(null);
                setLens(value);
              }
            }}
          >
            <ToggleGroupItem value="all">Every dinner</ToggleGroupItem>
            <ToggleGroupItem value="usual">Your usual</ToggleGroupItem>
            <ToggleGroupItem value="late">After hours</ToggleGroupItem>
          </ToggleGroup>
          {lens !== 'all' && (
            <p className="plate-lens-finding">
              {plural(matching.length, 'order')}
              {lens === 'usual'
                ? ` from ${data.dots.find((d) => d.order.restaurant.id === data.usual)?.order.restaurant.name ?? 'your usual'}`
                : ' between 22:00 and 06:00'}
              .
            </p>
          )}
          <div className="plate-transport">
            <Button
              variant="outline"
              size="icon"
              disabled={reduced || total < 2}
              aria-label={
                playing ? 'Pause dinner replay' : 'Replay your dinners'
              }
              onClick={() => {
                setAnimate(false);
                setActive(null);
                setPinned(null);
                setLens('all');
                if (playing) setPlaying(false);
                else {
                  if (shown >= total) setCursor(1);
                  setPlaying(true);
                }
              }}
            >
              {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
            </Button>
            <div className="plate-scrubber">
              <Slider
                min={1}
                max={Math.max(2, total)}
                step={1}
                value={[Math.max(1, shown)]}
                disabled={total < 2}
                aria-label="Dinner in your history"
                aria-valuetext={`Dinner ${shown} of ${total}`}
                onValueChange={(values) => {
                  stop();
                  setCursor(values[0] ?? total);
                  setPinned(null);
                }}
              />
              <span>
                {number(shown)} of {number(total)} dinners
                {reduced ? ' · drag to rewind' : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              className="plate-shuffle"
              onClick={() => {
                stop();
                setCursor(null);
                setLens('all');
                setPinned(Math.floor(Math.random() * total));
              }}
            >
              <Shuffle aria-hidden /> Surprise me
            </Button>
          </div>
        </div>
        {receipt && (
          <div className="dinner-ticket" aria-label="Dinner receipt">
            <div className="ticket-top">
              <span>
                {selected
                  ? `Dinner ${number((selectedIndex ?? 0) + 1)}`
                  : 'Your latest dinner'}
              </span>
              <span>
                {date(receipt.order.placedAt)}{' '}
                {local(receipt.order.placedAt).year} · {clock(receipt.order)}
              </span>
            </div>
            <div className="ticket-main">
              <strong>{receipt.order.restaurant.name}</strong>
              <span>{euros(receipt.order.money.total)}</span>
            </div>
            <p>
              {receipt.order.items
                .slice(0, 2)
                .map((item) => `${item.quantity} × ${item.name}`)
                .join(', ')}
              {receipt.order.items.length > 2
                ? ` + ${receipt.order.items.length - 2} more`
                : ''}
            </p>
            <a href={hrefFor({ ...filters, order: receipt.order.id })}>
              Open this order
            </a>
          </div>
        )}
      </div>
      <div className="hero-figure" ref={ref}>
        <Figure
          caption="Time of day around the rim. Your first order at the centre, your latest at the edge."
          headers={['Date', 'Restaurant', 'Total']}
          rows={orders.map((o) => [
            o.placedAt,
            o.restaurant.name,
            (o.money.total / 100).toFixed(2),
          ])}
        >
          <div
            className="plate-playground"
            data-playing={playing}
            data-lens={lens}
          >
            <div className="plate">
              <svg
                viewBox="0 0 1000 1000"
                role="img"
                aria-label={`A plate of ${total} orders. Time of day around the rim, dates from centre to edge. Use arrow keys to explore.`}
                tabIndex={0}
                onPointerMove={(e) => {
                  setActive(nearest(e.currentTarget, e.clientX, e.clientY));
                  setPoint({ x: e.clientX, y: e.clientY });
                }}
                onPointerLeave={() => setActive(null)}
                onFocus={(e) => {
                  const box = e.currentTarget.getBoundingClientRect();
                  setPoint({
                    x: box.x + box.width / 2,
                    y: box.y + box.height / 2,
                  });
                  setActive(0);
                }}
                onBlur={() => setActive(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setActive(null);
                    return;
                  }
                  if (e.key === 'Enter' && dot) {
                    location.href = hrefFor({
                      ...filters,
                      order: dot.order.id,
                    });
                    return;
                  }
                  if (
                    [
                      'ArrowLeft',
                      'ArrowRight',
                      'ArrowUp',
                      'ArrowDown',
                      'Home',
                      'End',
                    ].includes(e.key) &&
                    shown
                  ) {
                    e.preventDefault();
                    setPlaying(false);
                    setActive((i) =>
                      e.key === 'Home'
                        ? 0
                        : e.key === 'End'
                          ? shown - 1
                          : ((i ?? 0) +
                              (e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                                ? -1
                                : 1) +
                              shown) %
                            shown,
                    );
                  }
                }}
                onClick={(e) => {
                  const index = nearest(e.currentTarget, e.clientX, e.clientY),
                    picked = index === null ? undefined : visible[index];
                  if (picked)
                    location.href = hrefFor({
                      ...filters,
                      order: picked.order.id,
                    });
                }}
              >
                <circle
                  cx="500"
                  cy="500"
                  r="463"
                  fill="var(--m-surface)"
                  stroke="var(--m-line-strong)"
                  strokeWidth="1.2"
                />
                <circle
                  cx="500"
                  cy="500"
                  r="448"
                  fill="none"
                  stroke="var(--m-line)"
                />
                {Array.from({ length: 24 }, (_, hour) => {
                  const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2,
                    r = hour % 6 === 0 ? 451 : 456;
                  return (
                    <line
                      key={hour}
                      x1={500 + Math.cos(angle) * r}
                      y1={500 + Math.sin(angle) * r}
                      x2={500 + Math.cos(angle) * 463}
                      y2={500 + Math.sin(angle) * 463}
                      stroke="var(--m-line-strong)"
                      strokeWidth="1.2"
                    />
                  );
                })}
                <circle
                  cx="500"
                  cy="500"
                  r="76"
                  fill="none"
                  stroke="var(--m-line)"
                />
                {data.years.map(({ year, r }, i) => (
                  <g key={year}>
                    <circle
                      cx="500"
                      cy="500"
                      r={r}
                      fill="none"
                      stroke="var(--m-line)"
                    />
                    {(width > 450 || i % 2 === 0) && (
                      <text
                        x={500 + r * 0.5}
                        y={500 - r * 0.866}
                        fontSize={labelSize}
                        fill="var(--m-ink-faint)"
                        paintOrder="stroke"
                        stroke="var(--m-surface)"
                        strokeWidth="6"
                      >
                        {year}
                      </text>
                    )}
                  </g>
                ))}
                {selected && (
                  <line
                    x1={500 + Math.cos(selected.angle) * 80}
                    y1={500 + Math.sin(selected.angle) * 80}
                    x2={500 + Math.cos(selected.angle) * 445}
                    y2={500 + Math.sin(selected.angle) * 445}
                    stroke="var(--m-line-strong)"
                    strokeWidth="1.5"
                  />
                )}
                {visible.map((d, i) => (
                  <circle
                    key={d.order.id}
                    data-plate-dot
                    cx={d.x}
                    cy={d.y}
                    r={total <= 100 ? 9 : width < 450 ? 6 : 5}
                    fill={
                      matches(d.order)
                        ? d.order.group.isGroup
                          ? 'var(--m-data-2)'
                          : 'var(--m-data-1)'
                        : 'var(--m-muted)'
                    }
                    opacity={matches(d.order) ? 0.85 : 0.2}
                    stroke="var(--m-surface)"
                    strokeWidth="1.5"
                    className={animate && lens === 'all' ? 'plate-dot' : ''}
                    style={
                      animate
                        ? {
                            animationDelay: `${(i / Math.max(1, total - 1)) * 2250}ms`,
                          }
                        : undefined
                    }
                  />
                ))}
                {selected && (
                  <circle
                    cx={selected.x}
                    cy={selected.y}
                    r="9"
                    fill="var(--m-accent)"
                    stroke="var(--m-ink)"
                    strokeWidth="1.5"
                  />
                )}
                {[
                  { text: '00', x: 500, y: 18 },
                  { text: '06', x: 980, y: 505 },
                  { text: '12', x: 500, y: 990 },
                  { text: '18', x: 20, y: 505 },
                ].map((t) => (
                  <text
                    key={t.text}
                    x={t.x}
                    y={t.y}
                    textAnchor="middle"
                    fill="var(--m-ink-faint)"
                    fontSize={labelSize}
                  >
                    {t.text}
                  </text>
                ))}
                <text
                  x="500"
                  y={500 - labelSize * 0.3}
                  textAnchor="middle"
                  fill="var(--m-ink-faint)"
                  fontSize={labelSize}
                >
                  {selected ? clock(selected.order) : 'First'}
                </text>
                <text
                  x="500"
                  y={500 + labelSize * 1.1}
                  textAnchor="middle"
                  fill="var(--m-ink)"
                  fontSize={labelSize}
                >
                  {
                    local(
                      (selected ?? data.dots[0])?.order.placedAt ??
                        '2000-01-01',
                    ).year
                  }
                </text>
              </svg>
              <ChartTooltip
                tip={
                  dot
                    ? {
                        ...point,
                        title: dot.order.restaurant.name,
                        detail: `${date(dot.order.placedAt)} · ${clock(dot.order)} · ${euros(dot.order.money.total)}`,
                      }
                    : null
                }
              />
            </div>
          </div>
          <div className="legend">
            <span>
              <i />
              On your own
            </span>
            <span>
              <i className="group" />
              Group order
            </span>
          </div>
        </Figure>
      </div>
    </section>
  );
}
