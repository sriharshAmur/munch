import { useEffect, useMemo, useState } from 'react';
import { Delaunay } from 'd3-delaunay';
import { scaleLinear } from 'd3-scale';
import { local, sorted } from '@core/analyze/shared';
import type { Order } from '@core/schema';
import { date, euros } from '@/lib/format';
import { ChartTooltip, hrefFor, useSize } from './primitives';
import { useFilters } from '@/lib/search';
export function Plate({ orders }: { orders: Order[] }) {
  const { ref, width } = useSize(),
    filters = useFilters(),
    [active, setActive] = useState<number | null>(null),
    [point, setPoint] = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(
    () =>
      !sessionStorage.getItem('munch-plate-filled') &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
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
    const dots = rows.map((order) => {
      const p = local(order.placedAt),
        angle = ((p.hour * 60 + p.minute) / 1440) * Math.PI * 2 - Math.PI / 2,
        r = radius(Date.parse(order.placedAt));
      return {
        order,
        x: 500 + Math.cos(angle) * r,
        y: 500 + Math.sin(angle) * r,
      };
    });
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
    return {
      dots,
      years,
      delaunay: Delaunay.from(
        dots,
        (d) => d.x,
        (d) => d.y,
      ),
    };
  }, [orders]);
  const dot = active === null ? null : data.dots[active];
  const labelSize = (13 * 1000) / Math.max(width, 300);
  return (
    <div className="plate" ref={ref}>
      <svg
        viewBox="0 0 1000 1000"
        role="img"
        aria-label={`A plate of ${orders.length} orders. Time of day around the rim, dates from centre to edge. Use arrow keys to explore.`}
        tabIndex={0}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect(),
            x = ((e.clientX - box.x) / box.width) * 1000,
            y = ((e.clientY - box.y) / box.height) * 1000;
          if (!data.dots.length) return;
          const i = data.delaunay.find(x, y);
          const d = data.dots[i];
          if (d && Math.hypot(x - d.x, y - d.y) < 35) {
            setActive(i);
            setPoint({ x: e.clientX, y: e.clientY });
          } else setActive(null);
        }}
        onPointerLeave={() => setActive(null)}
        onFocus={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setPoint({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
          setActive(0);
        }}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setActive(null);
            return;
          }
          if (e.key === 'Enter' && dot) {
            location.href = hrefFor({ ...filters, order: dot.order.id });
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
            ].includes(e.key)
          ) {
            e.preventDefault();
            setActive((i) =>
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? data.dots.length - 1
                  : ((i ?? 0) +
                      (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) +
                      data.dots.length) %
                    data.dots.length,
            );
          }
        }}
        onClick={() => {
          if (dot) location.href = hrefFor({ ...filters, order: dot.order.id });
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
        <circle cx="500" cy="500" r="448" fill="none" stroke="var(--m-line)" />
        <circle cx="500" cy="500" r="76" fill="none" stroke="var(--m-line)" />
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
        {data.dots.map((d, i) => (
          <circle
            key={d.order.id}
            cx={d.x}
            cy={d.y}
            r="3.5"
            fill={d.order.group.isGroup ? 'var(--m-data-2)' : 'var(--m-data-1)'}
            opacity=".85"
            className={animate ? 'plate-dot' : ''}
            style={
              animate
                ? {
                    animationDelay: `${(i / Math.max(1, data.dots.length - 1)) * 2250}ms`,
                  }
                : undefined
            }
          />
        ))}
        {dot && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r="8"
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
          First
        </text>
        <text
          x="500"
          y={500 + labelSize * 1.1}
          textAnchor="middle"
          fill="var(--m-ink)"
          fontSize={labelSize}
        >
          {data.dots[0] ? local(data.dots[0].order.placedAt).year : ''}
        </text>
      </svg>
      <ChartTooltip
        tip={
          dot
            ? {
                ...point,
                title: dot.order.restaurant.name,
                detail: `${date(dot.order.placedAt)} · ${String(local(dot.order.placedAt).hour).padStart(2, '0')}:${String(local(dot.order.placedAt).minute).padStart(2, '0')} · ${euros(dot.order.money.total)}`,
              }
            : null
        }
      />
    </div>
  );
}
