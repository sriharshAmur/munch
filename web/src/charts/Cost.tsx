import { cost } from '@core/analyze/cost';
import type { Order } from '@core/schema';
import { euros, percent } from '@/lib/format';
import { Chapter, Figure } from './primitives';
import { LineChart } from './Line';
export function CostChapter({ orders }: { orders: Order[] }) {
  const c = cost(orders),
    first = c.years[0],
    last = c.years.at(-1);
  const stats = [
    { label: 'Food', value: c.totals.items },
    { label: 'Delivery fees', value: c.totals.deliveryFee },
    { label: 'Service fees', value: c.totals.serviceFee },
    { label: 'Tips', value: c.totals.tip },
    { label: 'Discounts', value: c.totals.discount },
    ...(c.totals.smallOrderFee
      ? [{ label: 'Small-order fees', value: c.totals.smallOrderFee }]
      : []),
    ...(c.totals.adjustments
      ? [{ label: 'Order adjustments', value: c.totals.adjustments }]
      : []),
  ];
  return (
    <Chapter
      id="the-cost"
      title="The cost"
      lede={
        first && last ? (
          <>
            Your average order {first.year === last.year ? 'is' : 'went from'}{' '}
            {euros(first.average)}
            {first.year !== last.year && (
              <>
                {' '}
                in {first.year} to {euros(last.average)} in {last.year}
              </>
            )}
            . Food, fees and the occasional tip, all included.
          </>
        ) : (
          'No order totals in this view.'
        )
      }
    >
      <Figure
        caption="Order value includes account credit as well as other payment methods. Adjustments are kept separate from fees and discounts."
        headers={['Part of the order', 'Total']}
        rows={stats.map((s) => [s.label, euros(s.value)])}
      >
        <div className="cost-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <span>{s.label}</span>
              <strong className="text-stat">{euros(s.value, true)}</strong>
            </div>
          ))}
        </div>
      </Figure>
      <div className="cost-line">
        <Figure
          caption="The average total per order in each year. This includes fees, tips, discounts and order adjustments."
          headers={['Year', 'Average order']}
          rows={c.years.map((y) => [y.year, euros(y.average)])}
        >
          {c.years.length > 1 ? (
            <LineChart
              rows={c.years.map((y) => ({
                label: String(y.year),
                value: y.average,
                search: { year: y.year },
              }))}
              label="Average order value by year"
              format={(n) => euros(n, true)}
            />
          ) : (
            <p className="empty-finding">
              One year in this view. The average basket is{' '}
              {euros(first?.average ?? 0)}.
            </p>
          )}
        </Figure>
      </div>
      <p className="payday text-body">
        {c.otherRate > 0 ? (
          <>
            From the 26th to the 30th, you order{' '}
            {percent(Math.abs(c.paydayRate / c.otherRate - 1))}{' '}
            {c.paydayRate >= c.otherRate ? 'more' : 'less'} often per day than
            during the rest of the month.
          </>
        ) : (
          'A little more history will make the monthly rhythm clearer.'
        )}
      </p>
    </Chapter>
  );
}
