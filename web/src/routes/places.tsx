import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useData, useHomeName } from '@/data/provider';
import { useFilters } from '@/lib/search';
import { useNow } from '@/lib/now';
import { applyFilter } from '@core/analyze/filter';
import { placeProfile, placeProfiles, type PlaceProfile, type PlaceStatus } from '@core/analyze/place';
import { weekdays } from '@core/analyze/shared';
import { ago, clock, date, euros, every, monthKey, number, oneIn, percent, plural } from '@/lib/format';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Monogram } from '@/components/Monogram';
import { Bars } from '@/charts/Bars';
import { FilterChips, Highlight, SearchBox, Summary, useSearchShortcut, useSheetReturnFocus, useSmallScreen } from './parts';

export const statusWords: Record<PlaceStatus, string> = {
  regular: 'Regular',
  'gone-quiet': 'Gone quiet',
  'old-home': 'Old home',
  'one-time': 'Tried once',
  new: 'New',
  'now-and-then': 'Now and then',
};
const statusHint: Record<PlaceStatus, string> = {
  regular: 'Four or more orders, usually less than a month apart',
  'gone-quiet': 'You used to order here and stopped, though you still live nearby',
  'old-home': 'Near a home you have since moved away from',
  'one-time': 'One order, and not since',
  new: 'Your first order here was in the last six weeks',
  'now-and-then': 'Back every so often',
};
type SortKey = 'orders' | 'latest' | 'spend' | 'name';
type Show = 'all' | 'regular' | 'gone-quiet' | 'one-time';

function Status({ status }: { status: PlaceStatus }) {
  return (
    <span className="status" data-status={status} title={statusHint[status]}>
      {statusWords[status]}
    </span>
  );
}

/** A year of months as tiny columns, so places can be compared at a glance. */
function Spark({ months }: { months: { month: string; count: number }[] }) {
  const recent = months.slice(-12);
  const max = Math.max(1, ...recent.map((m) => m.count));
  return (
    <span className="spark" aria-hidden="true">
      {recent.map((m) => (
        <i key={m.month} data-empty={m.count === 0} style={{ height: `${m.count ? 20 + (m.count / max) * 80 : 8}%` }} />
      ))}
    </span>
  );
}

export function Places() {
  const { state } = useData(),
    filters = useFilters(),
    navigate = useNavigate(),
    homeName = useHomeName(),
    now = useNow(),
    search = useSearchShortcut(),
    small = useSmallScreen();
  const history = useMemo(() => (state.kind === 'ready' ? state.file.orders : []), [state]);
  const filtered = useMemo(() => applyFilter(history, { ...filters, restaurant: undefined }), [history, filters]);
  const places = useMemo(() => placeProfiles(filtered, now), [filtered, now]);
  const [sort, setSort] = useState<SortKey>('orders');
  const [show, setShow] = useState<Show>('all');
  const counts = useMemo(() => {
    const c: Record<Show, number> = { all: places.length, regular: 0, 'gone-quiet': 0, 'one-time': 0 };
    for (const p of places)
      if (p.status === 'regular' || p.status === 'gone-quiet' || p.status === 'one-time') c[p.status]++;
    return c;
  }, [places]);
  const q = (filters.q ?? '').toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const list = useMemo(
    () =>
      places
        .filter((p) => show === 'all' || p.status === show)
        .filter((p) => {
          if (!q.length) return true;
          const text = [p.name, p.cuisine ?? '', ...p.dishes.map((d) => d.name)].join(' ').toLocaleLowerCase();
          return q.every((w) => text.includes(w));
        })
        .sort((a, b) =>
          sort === 'latest'
            ? Date.parse(b.last) - Date.parse(a.last)
            : sort === 'spend'
              ? b.spend - a.spend
              : sort === 'name'
                ? a.name.localeCompare(b.name)
                : a.rank - b.rank,
        ),
    [places, show, sort, q.join(' ')], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const selected = useMemo(
    () => (filters.place ? placeProfile(history, filters.place, now) : null),
    [history, filters.place, now],
  );
  const returnFocus = useSheetReturnFocus(filters.place, () => search.current?.focus());
  const regulars = counts.regular;
  const once = places.filter((p) => p.count === 1).length;
  return (
    <section className="explorer">
      <div className="explorer-heading">
        <div>
          <h1 className="text-title">Your places</h1>
          <p className="explorer-lede">
            {plural(places.length, 'restaurant')}.{' '}
            {once ? `${once} got a single try` : 'Every one got a second order'}
            {regulars ? `, ${regulars} ${regulars === 1 ? 'is a regular' : 'are regulars'}` : ''}
            {counts['gone-quiet'] ? `, and ${counts['gone-quiet']} went quiet` : ''}.
          </p>
        </div>
      </div>
      <div className="explorer-tools">
        <SearchBox
          inputRef={search}
          label="Search restaurants"
          placeholder="Find a restaurant or a dish"
          value={filters.q ?? ''}
          result={`${plural(list.length, 'restaurant')} found`}
          onChange={(v) => void navigate({ to: '/places', search: { ...filters, q: v || undefined }, replace: true })}
        />
        <ToggleGroup type="single" className="segmented" value={sort} aria-label="Sort by" onValueChange={(v) => v && setSort(v as SortKey)}>
          <ToggleGroupItem value="orders">Most orders</ToggleGroupItem>
          <ToggleGroupItem value="latest">Latest</ToggleGroupItem>
          <ToggleGroupItem value="spend">Most spent</ToggleGroupItem>
          <ToggleGroupItem value="name">A to Z</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="show-tabs" role="group" aria-label="Show">
        {(['all', 'regular', 'gone-quiet', 'one-time'] as Show[])
          .filter((s) => s === 'all' || counts[s] > 0)
          .map((s) => (
            <button key={s} type="button" aria-pressed={show === s} onClick={() => setShow(s)}>
              {s === 'all' ? 'All' : statusWords[s]}
              <span>{counts[s]}</span>
            </button>
          ))}
      </div>
      <FilterChips filters={{ ...filters, restaurant: undefined }} route="/places" homeName={homeName} placeName={() => ''} />
      {list.length ? (
        <div className="table-host">
          <table className="places">
            <thead>
              <tr>
                <th scope="col" className="col-rank">
                  <span className="sr-only">Rank</span>
                </th>
                <th scope="col">Restaurant</th>
                <th scope="col" className="col-activity">
                  Last 12 months
                </th>
                <th scope="col" className="col-num">
                  Orders
                </th>
                <th scope="col" className="col-last">
                  Last order
                </th>
                <th scope="col" className="col-num col-spend">
                  Spent
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  className="place-row"
                  data-selected={p.id === filters.place}
                  onClick={(e) => {
                    if (e.target instanceof Element && e.target.closest('a')) return;
                    void navigate({ to: '/places', search: { ...filters, place: p.id } });
                  }}
                >
                  <td className="col-rank">{p.rank}</td>
                  <td>
                    <Link to="/places" search={{ ...filters, place: p.id }} className="place-cell">
                      <Monogram id={p.id} name={p.name} size={40} />
                      <span>
                        <strong>
                          <Highlight text={p.name} query={filters.q} />
                        </strong>
                        <span className="place-sub">
                          <Status status={p.status} />
                          {p.dishes[0] && (
                            <span className="place-usual">
                              <Highlight text={p.dishes[0].name} query={filters.q} />
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="col-activity">
                    <Spark months={p.months} />
                  </td>
                  <td className="col-num">
                    <span className="big-num">{number(p.count)}</span>
                  </td>
                  <td className="col-last">{ago(p.last, now)}</td>
                  <td className="col-num col-spend">{euros(p.spend, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-finding">
          <p>No restaurant matches{filters.q ? ` “${filters.q}”` : ''}.</p>
          <p className="text-small">The search looks at names and every dish you ordered there.</p>
        </div>
      )}
      <Summary
        items={[
          { label: 'Restaurants', value: number(places.length) },
          { label: 'Regulars', value: number(regulars) },
          { label: 'Top three', value: percent(places.slice(0, 3).reduce((s, p) => s + p.count, 0) / Math.max(1, filtered.length)) },
        ]}
      />
      <Sheet open={Boolean(selected)} onOpenChange={(v) => !v && void navigate({ to: '/places', search: { ...filters, place: undefined } })}>
        <SheetContent side={small ? 'bottom' : 'right'} className="detail-sheet" onCloseAutoFocus={returnFocus} onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement | null)?.focus(); }}>
          {selected && <PlaceDetail p={selected} now={now} total={places.length} homeName={homeName} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function PlaceDetail({ p, now, total, homeName }: { p: PlaceProfile; now: string; total: number; homeName: (k: string) => string }) {
  const filters = useFilters();
  const lede =
    p.count === 1
      ? `One order, on ${date(p.first, true)}. ${p.status === 'new' ? 'New to you, so the jury is out.' : 'Not again, so far.'}`
      : `You order here ${p.usualGap ? every(p.usualGap) : 'now and then'}, usually on a ${weekdays[p.typical.weekday]} around ${clock(p.typical.hour * 60)}. The last time was ${ago(p.last, now)}.`;
  const recent = p.months.slice(-12);
  const maxDay = Math.max(1, ...p.weekdays);
  return (
    <>
      <SheetHeader className="sheet-head">
        <Monogram id={p.id} name={p.name} size={52} />
        <div>
          <SheetTitle>{p.name}</SheetTitle>
          <SheetDescription className="sheet-tags">
            <Status status={p.status} />
            <span>
              Number {p.rank} of {total}
              {p.cuisine ? `, ${p.cuisine}` : ''}
            </span>
          </SheetDescription>
        </div>
      </SheetHeader>
      <div className="sheet-body" key={p.id}>
        <p className="sheet-context">{lede}</p>
        <dl className="tiles">
          <div>
            <dt>Orders</dt>
            <dd>{number(p.count)}</dd>
            <span>{oneIn(p.share)} of all yours</span>
          </div>
          <div>
            <dt>Spent</dt>
            <dd>{euros(p.spend, true)}</dd>
            <span>{euros(p.average)} an order</span>
          </div>
          <div>
            <dt>First order</dt>
            <dd className="tile-date">{date(p.first)}</dd>
            <span>{ago(p.first, now)}</span>
          </div>
          <div>
            <dt>Last order</dt>
            <dd className="tile-date">{date(p.last)}</dd>
            <span>{ago(p.last, now)}</span>
          </div>
        </dl>
        {p.count > 1 && (
          <section className="sheet-section">
            <h3>Month by month</h3>
            <Bars
              label={`Orders from ${p.name} each month`}
              height={88}
              gap={4}
              bars={recent.map((m) => ({
                key: m.month,
                value: m.count,
                title: monthKey(m.month),
                detail: m.count ? plural(m.count, 'order') : 'No orders',
                tick: monthKey(m.month).slice(0, 1),
                lit: m.count > 0 && m.count === Math.max(...recent.map((r) => r.count)),
                search: { restaurant: p.id, month: m.month },
              }))}
            />
          </section>
        )}
        {p.count > 2 && (
          <section className="sheet-section">
            <h3>Which day</h3>
            <ol className="week-bars">
              {weekdays.map((d, i) => (
                <li key={d} data-lit={p.weekdays[i] === maxDay}>
                  <span>{d.slice(0, 3)}</span>
                  <i style={{ '--w': `${((p.weekdays[i] ?? 0) / maxDay) * 100}%` } as CSSProperties} />
                  <b>{p.weekdays[i] || ''}</b>
                </li>
              ))}
            </ol>
          </section>
        )}
        <section className="sheet-section">
          <h3>{p.dishes.length > 1 ? 'What you order here' : 'What you ordered'}</h3>
          <ul className="dish-list">
            {p.dishes.slice(0, 8).map((d, i) => (
              <li key={d.name}>
                <Link to="/orders" search={{ restaurant: p.id, q: d.name }}>
                  <span className="dish-name">
                    {d.name}
                    {i === 0 && p.count > 1 && <em>your usual</em>}
                  </span>
                  <span className="dish-meta">
                    {d.change !== 0 && (
                      <span className="price-change" data-up={d.change > 0} title={`${euros(d.firstPrice)} then, ${euros(d.lastPrice)} now`}>
                        {d.change > 0 ? '+' : ''}
                        {percent(d.change)}
                      </span>
                    )}
                    <span>{d.count}×</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {p.homes.length > 1 && (
          <p className="text-small">
            Ordered from {p.homes.length} homes: {p.homes.map((h) => homeName(h)).join(', ')}.
          </p>
        )}
        <section className="sheet-section">
          <h3>Every order</h3>
          <ol className="visit-list">
            {[...p.orders].reverse().map((o) => (
              <li key={o.id}>
                <Link to="/orders" search={{ ...filters, place: undefined, order: o.id }}>
                  <span>{date(o.placedAt)}</span>
                  <span className="visit-dishes">{o.items.map((i) => i.name).join(', ')}</span>
                  <span className="visit-total">{euros(o.money.total)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
