import { useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Shuffle } from 'lucide-react';
import { useData, useHomeName } from '@/data/provider';
import { useFilters } from '@/lib/search';
import { useNow } from '@/lib/now';
import { applyFilter, availableHomes } from '@core/analyze/filter';
import { noticed } from '@core/analyze/noticed';
import { overview } from '@core/analyze/overview';
import { weekdays } from '@core/analyze/shared';
import { ago, clock, euros, month, monthKey, number, plural } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/story/CountUp';
import { useReducedMotion } from '@/story/palette';
import { Persona } from '@/story/Persona';
import { Rail } from '@/story/Rail';
import { Guess } from '@/story/Guess';
import { Stories } from './Stories';
import { CalendarCard, CompanyCard, CostCard, DishesCard, HomesCard, PlacesCard, WeeksCard, WhenCard } from './Cards';

export function Home() {
  const { state } = useData(),
    filters = useFilters(),
    homeName = useHomeName(),
    navigate = useNavigate(),
    now = useNow(),
    reduced = useReducedMotion();
  const history = useMemo(() => (state.kind === 'ready' ? state.file.orders : []), [state]);
  const orders = useMemo(() => applyFilter(history, filters), [history, filters]);
  const o = useMemo(() => overview(orders), [orders]);
  const found = useMemo(() => noticed(orders, now), [orders, now]);
  // Homes keep one colour on every page, in the order you lived in them.
  const homeKeys = useMemo(() => availableHomes(history).map((h) => h.key), [history]);
  const homeSlot = (key: string) => (Math.max(0, homeKeys.indexOf(key)) % 6) + 1;

  const scope = filters.year
    ? `in ${filters.year}`
    : filters.home
      ? `at ${homeName(filters.home)}`
      : o.first
        ? `since ${month(o.first)}`
        : '';

  if (!orders.length)
    return applyFilter(history).length ? (
      <article className="home home-empty" data-order-count={0}>
        <h1 className="text-title">No orders in this view.</h1>
        <p className="text-lede">Pick another year or home. Your history is still here.</p>
        <Link to="/" search={{}}>
          Show all time
        </Link>
      </article>
    ) : (
      <article className="home home-empty" data-order-count={0}>
        <h1 className="text-title">This file has no orders to read.</h1>
        <p className="text-lede">Run munch fetch and munch build again, then open data/orders.json.</p>
      </article>
    );

  const thin = o.count < 5;
  const last = orders.at(-1);
  const top = o.days[o.topDay] ?? 0;
  return (
    <article className="home" data-source={state.kind === 'ready' ? (state.demo ? 'demo' : 'local') : 'empty'} data-order-count={o.count}>
      <Stories history={history} />
      <header className="hero">
        <h1 className="hero-title">
          <CountUp value={o.count} reduced={reduced} duration={1.2} /> {o.count === 1 ? 'order' : 'orders'}{' '}
          <span className="hero-scope">{scope}.</span>
        </h1>
        {!thin && (
          <p className="hero-lede">
            About one every {o.everyDays.toFixed(1)} days. Most often on a {weekdays[o.topDay]} ({plural(top, 'order')}),
            and {Math.round(o.window.share * 100)}% of the time between {clock(o.window.hour * 60)} and{' '}
            {clock(((o.window.hour + 3) % 24) * 60)}.
          </p>
        )}
        <dl className="stats">
          <div>
            <dt>Spent</dt>
            <dd>{euros(o.cost.money.total, true)}</dd>
            <span>{euros(Math.round(o.cost.money.total / o.count))} an order</span>
          </div>
          <div>
            <dt>Restaurants</dt>
            <dd>{number(o.places.length)}</dd>
            <span>{o.oneTimers ? `${o.oneTimers} tried just once` : 'All of them twice or more'}</span>
          </div>
          {o.busiestMonth && (
            <div>
              <dt>Busiest month</dt>
              <dd>{monthKey(o.busiestMonth.month).split(' ')[0]}</dd>
              <span>{plural(o.busiestMonth.count, 'order')}</span>
            </div>
          )}
          {last && (
            <div>
              <dt>Last order</dt>
              <dd>{ago(last.placedAt, now)}</dd>
              <span className="truncate">{last.restaurant.name}</span>
            </div>
          )}
        </dl>
        <div className="hero-actions">
          <Button
            variant="outline"
            onClick={() => {
              const pick = orders[Math.floor(Math.random() * orders.length)];
              if (pick) void navigate({ to: '/orders', search: { ...filters, order: pick.id } });
            }}
          >
            <Shuffle aria-hidden="true" />
            Open a random order
          </Button>
          <Button variant="ghost" onClick={() => void navigate({ to: '/orders', search: filters })}>
            See every order
          </Button>
        </div>
      </header>
      {thin ? (
        <p className="home-thin">Only {plural(o.count, 'order')} in this view, too few to show a pattern. Pick another year or home.</p>
      ) : (
        <>
          <div className="bento">
            <WhenCard o={o} />
            <PlacesCard o={o} />
            <WeeksCard o={o} homeName={homeName} homeSlot={homeSlot} />
            <DishesCard o={o} />
            <CostCard o={o} />
            <CompanyCard o={o} />
            {o.homes.length > 3 && <HomesCard o={o} homeName={homeName} homeSlot={homeSlot} />}
            <CalendarCard o={o} span={o.homes.length > 1 && o.homes.length <= 3 ? 8 : 12} />
            {o.homes.length <= 3 && <HomesCard o={o} homeName={homeName} homeSlot={homeSlot} />}
          </div>
          <Rail found={found} orders={orders} now={now} homeName={homeName} />
          <Persona orders={orders} history={history} />
          <Guess orders={orders} now={now} />
        </>
      )}
    </article>
  );
}
