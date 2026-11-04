import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useData, useHomeName } from '@/data/provider';
import { useFilters } from '@/lib/search';
import { useNow } from '@/lib/now';
import { applyFilter } from '@core/analyze/filter';
import { matchOrder } from '@core/analyze/place';
import { local, median, sorted, weekdays } from '@core/analyze/shared';
import type { Order } from '@core/schema';
import { ago, clock, date, euros, month, monthKey, number, plural } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Monogram } from '@/components/Monogram';
import {
  FilterChips,
  Highlight,
  SearchBox,
  Summary,
  ordinal,
  useSearchShortcut,
  useSheetReturnFocus,
  useSmallScreen,
} from './parts';

type Sort = { by: 'date' | 'restaurant' | 'total'; desc: boolean };
type Line = { kind: 'month'; key: string; count: number; spend: number } | { kind: 'order'; order: Order };

const at = (o: Order) => {
  const p = local(o.placedAt);
  return clock(p.hour * 60 + p.minute);
};
const dishLine = (o: Order) => {
  const names = o.items.map((i) => (i.quantity > 1 ? `${i.quantity} × ${i.name}` : i.name));
  return names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', ');
};

export function Orders() {
  const { state } = useData(),
    filters = useFilters(),
    navigate = useNavigate(),
    homeName = useHomeName(),
    now = useNow(),
    search = useSearchShortcut(),
    small = useSmallScreen();
  const history = useMemo(() => (state.kind === 'ready' ? state.file.orders : []), [state]);
  const all = useMemo(() => sorted(history), [history]);
  // The first order at each place gets a "first time" tag.
  const firsts = useMemo(() => {
    const seen = new Set<string>(),
      out = new Set<string>();
    for (const o of all)
      if (!seen.has(o.restaurant.id)) {
        seen.add(o.restaurant.id);
        out.add(o.id);
      }
    return out;
  }, [all]);
  const names = useMemo(() => new Map(history.map((o) => [o.restaurant.id, o.restaurant.name])), [history]);
  const orders = useMemo(
    () =>
      applyFilter(history, { ...filters, includeCancelled: true }).filter(
        (o) => !filters.q || matchOrder(o, filters.q, [date(o.placedAt, true), `${weekdays[local(o.placedAt).weekday]}`]),
      ),
    [history, filters],
  );
  const [sort, setSort] = useState<Sort>({ by: 'date', desc: true });
  const list = useMemo(() => {
    const dir = sort.desc ? -1 : 1;
    return [...orders].sort((a, b) =>
      sort.by === 'date'
        ? dir * (Date.parse(a.placedAt) - Date.parse(b.placedAt))
        : sort.by === 'total'
          ? dir * (a.money.total - b.money.total) || Date.parse(b.placedAt) - Date.parse(a.placedAt)
          : dir * a.restaurant.name.localeCompare(b.restaurant.name) || Date.parse(b.placedAt) - Date.parse(a.placedAt),
    );
  }, [orders, sort]);
  // Sorted by date, the list breaks at each month with that month's totals.
  const lines = useMemo<Line[]>(() => {
    if (sort.by !== 'date') return list.map((order) => ({ kind: 'order', order }));
    const out: Line[] = [];
    let current = { kind: 'month' as const, key: '', count: 0, spend: 0 };
    for (const order of list) {
      const key = local(order.placedAt).date.slice(0, 7);
      if (current.key !== key) {
        current = { kind: 'month', key, count: 0, spend: 0 };
        out.push(current);
      }
      if (order.status !== 'cancelled') {
        current.count++;
        current.spend += order.money.total;
      }
      out.push({ kind: 'order', order });
    }
    return out;
  }, [list, sort.by]);

  const host = useRef<HTMLDivElement>(null);
  const virtualize = lines.length > 400;
  const virtual = useVirtualizer({
    count: virtualize ? lines.length : 0,
    getScrollElement: () => host.current,
    estimateSize: (i) => (lines[i]?.kind === 'month' ? 52 : 72),
    overscan: 12,
  });
  const items = virtual.getVirtualItems();
  const shown = virtualize ? items.flatMap((v) => (lines[v.index] ? [{ line: lines[v.index] as Line, index: v.index }] : [])) : lines.map((line, index) => ({ line, index }));
  const padTop = virtualize ? (items[0]?.start ?? 0) : 0;
  const padBottom = virtualize ? Math.max(0, virtual.getTotalSize() - (items.at(-1)?.end ?? 0)) : 0;

  const returnFocus = useSheetReturnFocus(filters.order, () => search.current?.focus());
  const selected = history.find((o) => o.id === filters.order);
  const counted = orders.filter((o) => o.status !== 'cancelled');
  const spend = counted.reduce((s, o) => s + o.money.total, 0);
  const anyPickup = history.some((o) => o.fulfilment === 'pickup');
  const anyGroup = history.some((o) => o.group.isGroup);
  const open = (o: Order) => void navigate({ to: '/orders', search: { ...filters, order: o.id } });
  const header = (by: Sort['by'], label: string, className?: string) => {
    const active = sort.by === by;
    return (
      <th scope="col" className={className} aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : undefined}>
        <button
          type="button"
          className="sort"
          data-active={active}
          onClick={() => setSort(active ? { by, desc: !sort.desc } : { by, desc: by !== 'restaurant' })}
        >
          {label}
          {active && (sort.desc ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />)}
        </button>
      </th>
    );
  };
  return (
    <section className="explorer" data-order-count={orders.length}>
      <div className="explorer-heading">
        <div>
          <h1 className="text-title">Every order</h1>
          <p className="explorer-lede">
            {filters.q || orders.length !== history.length
              ? `${plural(orders.length, 'order')} in this view, out of ${number(history.length)}.`
              : `${plural(orders.length, 'order')}, from ${all[0] ? month(all[0].placedAt) : 'the start'} to ${all.at(-1) ? ago(all.at(-1)?.placedAt ?? now, now) : 'now'}.`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (state.kind !== 'ready') return;
            const url = URL.createObjectURL(new Blob([JSON.stringify(state.file)], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'orders.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          <Download aria-hidden="true" />
          Download orders.json
        </Button>
      </div>
      <div className="explorer-tools">
        <SearchBox
          inputRef={search}
          label="Search orders"
          placeholder="Search a restaurant, a dish or a month"
          value={filters.q ?? ''}
          result={`${plural(orders.length, 'order')} found`}
          onChange={(q) => void navigate({ to: '/orders', search: { ...filters, q: q || undefined, order: undefined }, replace: true })}
        />
        {anyPickup && (
          <ToggleGroup
            type="single"
            className="segmented"
            value={filters.fulfilment ?? 'all'}
            aria-label="Delivery or pickup"
            onValueChange={(v) => {
              if (v === 'all' || v === 'delivery' || v === 'pickup')
                void navigate({ to: '/orders', search: { ...filters, fulfilment: v === 'all' ? undefined : v } });
            }}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="delivery">Delivery</ToggleGroupItem>
            <ToggleGroupItem value="pickup">Pickup</ToggleGroupItem>
          </ToggleGroup>
        )}
        {anyGroup && (
          <ToggleGroup
            type="single"
            className="segmented"
            value={filters.company ?? 'all'}
            aria-label="Company"
            onValueChange={(v) => {
              if (v === 'all' || v === 'solo' || v === 'group')
                void navigate({ to: '/orders', search: { ...filters, company: v === 'all' ? undefined : v } });
            }}
          >
            <ToggleGroupItem value="all">Everyone</ToggleGroupItem>
            <ToggleGroupItem value="solo">On your own</ToggleGroupItem>
            <ToggleGroupItem value="group">Group</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      <FilterChips filters={filters} route="/orders" homeName={homeName} placeName={(id) => names.get(id) ?? 'A restaurant'} />
      <Summary
        items={[
          { label: 'Orders', value: number(counted.length) },
          { label: 'Spent', value: euros(spend, true) },
          { label: 'Average', value: counted.length ? euros(Math.round(spend / counted.length)) : '–' },
          { label: 'Restaurants', value: number(new Set(counted.map((o) => o.restaurant.id)).size) },
        ]}
      />
      {orders.length ? (
        <div className="table-host" ref={host} data-virtual={virtualize}>
          <table className="orders" aria-rowcount={list.length + 1}>
            <thead>
              <tr>
                {header('date', 'When', 'col-when')}
                {header('restaurant', 'Order', 'col-order')}
                <th scope="col" className="col-tags">
                  <span className="sr-only">Tags</span>
                </th>
                {header('total', 'Total', 'col-total')}
              </tr>
            </thead>
            <tbody>
              {padTop > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={4} style={{ height: padTop, padding: 0 }} />
                </tr>
              )}
              {shown.map(({ line, index }) =>
                line.kind === 'month' ? (
                  <tr key={`m${line.key}`} className="month-row" data-index={index} ref={virtualize ? virtual.measureElement : undefined}>
                    <th colSpan={4} scope="rowgroup">
                      <span>{monthKey(line.key)}</span>
                      <span className="month-meta">
                        {plural(line.count, 'order')}, {euros(line.spend, true)}
                      </span>
                    </th>
                  </tr>
                ) : (
                  <tr
                    key={line.order.id}
                    data-index={index}
                    ref={virtualize ? virtual.measureElement : undefined}
                    className="order-row"
                    data-cancelled={line.order.status === 'cancelled'}
                    data-selected={line.order.id === filters.order}
                    onClick={(e) => {
                      if (e.target instanceof Element && e.target.closest('a')) return;
                      open(line.order);
                    }}
                  >
                    <td className="col-when">
                      <Link to="/orders" search={{ ...filters, order: line.order.id }} className="when">
                        <span>{date(line.order.placedAt)}</span>
                        <span className="when-time">{at(line.order)}</span>
                      </Link>
                    </td>
                    <td className="col-order">
                      <div className="order-cell">
                        <Monogram id={line.order.restaurant.id} name={line.order.restaurant.name} size={36} />
                        <div>
                          <strong>
                            <Highlight text={line.order.restaurant.name} query={filters.q} />
                          </strong>
                          <span className="dish-line">
                            <Highlight text={dishLine(line.order)} query={filters.q} />
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="col-tags">
                      <Tags order={line.order} first={firsts.has(line.order.id)} />
                    </td>
                    <td className="col-total">{euros(line.order.money.total)}</td>
                  </tr>
                ),
              )}
              {padBottom > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={4} style={{ height: padBottom, padding: 0 }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-finding">
          <p>No orders match{filters.q ? ` “${filters.q}”` : ' this view'}.</p>
          <p className="text-small">Every word of a search has to appear, in the restaurant, a dish or the date. Try fewer words, or clear a filter.</p>
        </div>
      )}
      <Sheet open={Boolean(selected)} onOpenChange={(v) => !v && void navigate({ to: '/orders', search: { ...filters, order: undefined } })}>
        <SheetContent side={small ? 'bottom' : 'right'} className="detail-sheet" onCloseAutoFocus={returnFocus} onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement | null)?.focus(); }}>
          {selected && <OrderDetail order={selected} history={all} list={list} first={firsts.has(selected.id)} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function Tags({ order, first }: { order: Order; first: boolean }) {
  return (
    <span className="tags">
      {order.status === 'cancelled' && <Badge variant="outline">Cancelled</Badge>}
      {first && order.status !== 'cancelled' && <Badge data-tone="new">First time</Badge>}
      {order.group.isGroup && <Badge data-tone="group">Group{order.group.groupSize ? ` of ${order.group.groupSize}` : ''}</Badge>}
      {order.fulfilment === 'pickup' && <Badge variant="secondary">Pickup</Badge>}
    </span>
  );
}

function OrderDetail({ order, history, list, first }: { order: Order; history: Order[]; list: Order[]; first: boolean }) {
  const filters = useFilters(),
    navigate = useNavigate();
  const visits = history.filter((o) => o.restaurant.id === order.restaurant.id);
  const nth = visits.findIndex((o) => o.id === order.id) + 1;
  const before = visits[nth - 2];
  const gap = before ? Math.round((Date.parse(order.placedAt) - Date.parse(before.placedAt)) / 86400000) : null;
  const usual = Math.round(median(visits.map((o) => o.money.total)));
  const diff = order.money.total - usual;
  const position = list.findIndex((o) => o.id === order.id);
  const prev = position > 0 ? list[position - 1] : undefined,
    next = position >= 0 ? list[position + 1] : undefined;
  const go = (o: Order | undefined) => o && void navigate({ to: '/orders', search: { ...filters, order: o.id }, replace: true });
  // Arrow keys step through the list without closing the sheet.
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'j') go(next);
      else if (e.key === 'ArrowLeft' || e.key === 'k') go(prev);
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });
  const p = local(order.placedAt);
  return (
    <>
      <SheetHeader className="sheet-head">
        <Monogram id={order.restaurant.id} name={order.restaurant.name} size={52} />
        <div>
          <SheetTitle>{order.restaurant.name}</SheetTitle>
          <SheetDescription>
            {weekdays[p.weekday]} {date(order.placedAt, true)}, {at(order)}
          </SheetDescription>
        </div>
      </SheetHeader>
      <div className="sheet-body" key={order.id}>
        <p className="sheet-context">
          {order.status === 'cancelled'
            ? 'This order was cancelled, so it is left out of every count.'
            : first
            ? `Your first order from ${order.restaurant.name}.`
            : `Your ${ordinal(nth)} order from ${order.restaurant.name}${gap !== null ? `, ${plural(gap, 'day')} after the one before` : ''}.`}{' '}
          {order.status === 'cancelled'
            ? ''
            : visits.length > 2 && Math.abs(diff) >= 100
            ? `${euros(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than your usual order here.`
            : visits.length > 2
              ? 'About what you usually spend here.'
              : ''}
        </p>
        <Tags order={order} first={false} />
        <ul className="order-items">
          {order.items.map((i, index) => (
            <li key={index}>
              <span className="qty">{i.quantity}</span>
              <div>
                <strong>{i.name}</strong>
                {i.options.length > 0 && <span>{i.options.join(', ')}</span>}
              </div>
              <span className="price">{euros(i.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="receipt">
          {[
            { label: 'Food', value: order.money.items },
            { label: 'Delivery', value: order.money.deliveryFee },
            { label: 'Service fee', value: order.money.serviceFee },
            { label: 'Small-order fee', value: order.money.smallOrderFee },
            { label: 'Tip', value: order.money.tip },
            { label: 'Discount', value: -order.money.discount },
            { label: 'Adjustments', value: order.money.adjustments },
          ]
            .filter((v) => v.value !== 0)
            .map((v) => (
              <div key={v.label}>
                <dt>{v.label}</dt>
                <dd>{euros(v.value)}</dd>
              </div>
            ))}
          <div className="receipt-total">
            <dt>Total</dt>
            <dd>{euros(order.money.total)}</dd>
          </div>
        </dl>
        {order.payment && <p className="text-small">Paid with {order.payment}</p>}
        {visits.length > 1 && (
          <div className="visit-strip">
            <h3>
              Every order from here <span>{visits.length}</span>
            </h3>
            <ol>
              {visits.map((v) => (
                <li key={v.id}>
                  <Link
                    to="/orders"
                    search={{ ...filters, order: v.id }}
                    replace
                    aria-current={v.id === order.id ? 'true' : undefined}
                    aria-label={`${date(v.placedAt, true)}, ${euros(v.money.total)}`}
                    title={`${date(v.placedAt)}, ${euros(v.money.total)}`}
                  />
                </li>
              ))}
            </ol>
          </div>
        )}
        <Link className="sheet-link" to="/places" search={{ place: order.restaurant.id }}>
          Everything about {order.restaurant.name}
        </Link>
      </div>
      <div className="sheet-nav">
        <button type="button" onClick={() => go(prev)} disabled={!prev}>
          <ChevronLeft aria-hidden="true" />
          Previous
        </button>
        <span>
          {position + 1} of {list.length}
        </span>
        <button type="button" onClick={() => go(next)} disabled={!next}>
          Next
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
