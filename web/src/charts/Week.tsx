import { scaleQuantile } from 'd3-scale';
import { rhythm } from '@core/analyze/rhythm';
import { weekdays } from '@core/analyze/shared';
import type { Order } from '@core/schema';
import { percent, plural, time } from '@/lib/format';
import { Chapter, Figure, Mark, useSize } from './primitives';
export function WeekGrid({
  cells,
  dots = false,
}: {
  cells: ReturnType<typeof rhythm>['cells'];
  dots?: boolean;
}) {
  const { ref, width } = useSize(),
    left = 42,
    step = (width - left) / 24,
    row = Math.max(19, Math.min(42, step)),
    height = row * 7 + 35;
  const scale = scaleQuantile<number>()
    .domain(cells.filter((c) => c.count).map((c) => c.count))
    .range([1, 2, 3, 4, 5]);
  const peak = [...cells].sort((a, b) => b.count - a.count)[0];
  return (
    <div ref={ref}>
      <svg
        width={width}
        height={height}
        aria-label={
          dots
            ? 'Group orders by weekday and hour'
            : 'Orders by weekday and hour'
        }
      >
        {weekdays.map((name, i) => (
          <text key={name} x="0" y={i * row + row * 0.65} className="text-tick">
            {name.slice(0, 3)}
          </text>
        ))}
        {cells.map((c, i) => (
          <Mark
            key={i}
            index={i}
            title={`${weekdays[c.weekday]}, ${time(c.hour)}`}
            detail={plural(c.count, 'order')}
            search={{
              weekday: c.weekday,
              hour: c.hour,
              ...(dots ? { company: 'group' } : {}),
            }}
          >
            <rect
              x={left + c.hour * step + 1}
              y={c.weekday * row + 1}
              width={Math.max(1, step - 2)}
              height={row - 2}
              rx="3"
              fill={
                dots
                  ? 'var(--m-raised)'
                  : c.count
                    ? `var(--m-seq-${scale(c.count)})`
                    : 'var(--m-raised)'
              }
              stroke={!dots && c === peak && c.count ? 'var(--m-ink)' : 'none'}
              strokeWidth="2"
            />
            {dots && c.count > 0 && (
              <circle
                cx={left + (c.hour + 0.5) * step}
                cy={(c.weekday + 0.5) * row}
                r={Math.max(
                  2,
                  Math.min(row * 0.36, 2 + Math.sqrt(c.count) * 2),
                )}
                fill="var(--m-data-2)"
                stroke="var(--m-surface)"
                strokeWidth="2"
              />
            )}
          </Mark>
        ))}
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
          <text
            key={h}
            x={left + (h + 0.5) * step}
            y={height - 8}
            className="text-tick"
            textAnchor="middle"
          >
            {String(h).padStart(2, '0')}
          </text>
        ))}
      </svg>
      {!dots && (
        <div className="ramp">
          <span>Fewer orders</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} style={{ background: `var(--m-seq-${n})` }} />
          ))}
          <span>More</span>
        </div>
      )}
    </div>
  );
}
export function WeekChapter({ orders }: { orders: Order[] }) {
  const r = rhythm(orders);
  return (
    <Chapter
      id="your-week"
      title="Your week"
      lede={
        <>
          {percent(r.peakShare)} of your orders land between{' '}
          {time(r.peakWindow.hour)} and {time(r.peakWindow.hour + 3)}.{' '}
          {weekdays[r.peak.weekday]} at {time(r.peak.hour)} is your busiest
          hour.
        </>
      }
    >
      <Figure
        caption="Your ordering week, on Amsterdam time. Each square is one hour. The outlined square is the busiest."
        headers={['Day', 'Hour', 'Orders']}
        rows={r.cells.map((c) => [
          weekdays[c.weekday] ?? '',
          time(c.hour),
          c.count,
        ])}
      >
        <WeekGrid cells={r.cells} />
      </Figure>
    </Chapter>
  );
}
