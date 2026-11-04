import { scaleBand, scaleLinear } from 'd3-scale';
import { timeline } from '@core/analyze/timeline';
import type { Order } from '@core/schema';
import { euros, month, plural } from '@/lib/format';
import { Axis, Chapter, Figure, Grid, Mark, useSize } from './primitives';
function Monthly({
  data,
  spend = false,
}: {
  data: ReturnType<typeof timeline>;
  spend?: boolean;
}) {
  const { ref, width } = useSize(),
    height = spend ? 180 : 250;
  const max = Math.max(
      1,
      ...data.months.map((m) => (spend ? m.spend : m.count)),
    ),
    top = Math.ceil(max / (spend ? 10000 : 5)) * (spend ? 10000 : 5),
    y = scaleLinear()
      .domain([0, top])
      .range([height - 30, 30]),
    x = scaleBand()
      .domain(data.months.map((m) => m.month))
      .range([42, width - 8])
      .padding(0.18);
  const ticks = [0, top / 2, top];
  const interval =
    width < 500
      ? Math.ceil(data.months.length / 4)
      : Math.max(1, Math.ceil(data.months.length / 9));
  return (
    <div ref={ref}>
      <div className="chart-unit">
        {spend ? 'Order value' : 'Orders per month'}
      </div>
      <svg
        width={width}
        height={height}
        aria-label={spend ? 'Monthly spend' : 'Monthly orders'}
      >
        <Grid
          ticks={ticks}
          width={width}
          height={height}
          format={(n) => (spend ? euros(n, true) : String(n))}
        />
        {data.months.map((m, i) => {
          const value = spend ? m.spend : m.count,
            w = Math.min(18, x.bandwidth()),
            left = (x(m.month) ?? 0) + (x.bandwidth() - w) / 2;
          return (
            <Mark
              key={m.month}
              index={i}
              title={month(m.month + '-01')}
              detail={spend ? euros(value) : plural(value, 'order')}
              search={{ month: m.month }}
            >
              <rect
                x={left - 2}
                y="25"
                width={Math.max(8, w + 4)}
                height={height - 55}
                fill="transparent"
              />
              <rect
                x={left}
                y={y(value)}
                width={w}
                height={height - 30 - y(value)}
                rx="4"
                fill="var(--m-data-1)"
              />
            </Mark>
          );
        })}
        <Axis
          ticks={data.months
            .filter((_, i) => i % interval === 0)
            .map((m) => ({
              x: (x(m.month) ?? 0) + x.bandwidth() / 2,
              label:
                data.months.length > 24
                  ? m.month.slice(0, 4)
                  : new Intl.DateTimeFormat('en-GB', {
                      timeZone: 'Europe/Amsterdam',
                      month: 'short',
                      year: '2-digit',
                    }).format(new Date(m.month + '-01')),
            }))}
          y={height - 4}
        />
      </svg>
    </div>
  );
}
export function TimelineChapter({ orders }: { orders: Order[] }) {
  const t = timeline(orders),
    peak = t.busiest;
  return (
    <Chapter
      id="the-years"
      title="The years"
      lede={
        peak ? (
          <>
            Your busiest month was {month(peak.month + '-01')}, with{' '}
            {plural(peak.count, 'order')}. Some months, the kitchen got a little
            more time off.
          </>
        ) : (
          'There are no orders in this view. Pick another year.'
        )
      }
    >
      <Figure
        caption="Months without orders stay in the picture. Orders and spend have separate scales on the same timeline."
        headers={['Month', 'Orders', 'Spend']}
        rows={t.months.map((m) => [
          month(m.month + '-01'),
          m.count,
          euros(m.spend),
        ])}
      >
        <Monthly data={t} />
        <div className="home-bands">
          {t.homes.map((h) => (
            <span key={h.key}>
              Home {h.key} · {h.city}
            </span>
          ))}
        </div>
        <Monthly data={t} spend />
      </Figure>
    </Chapter>
  );
}
