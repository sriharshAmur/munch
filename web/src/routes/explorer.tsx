import { useMemo, useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, Search as SearchIcon, X } from 'lucide-react';
import { useData } from '@/data/provider';
import { useFilters } from '@/lib/search';
import { applyFilter } from '@core/analyze/filter';
import { regulars } from '@core/analyze/regulars';
import { sorted, weekdays } from '@core/analyze/shared';
import type { Order } from '@core/schema';
import { date, euros, plural, time } from '@/lib/format';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Lifetime } from '@/charts/Regulars';
function useSmallScreen() {
  const [small, setSmall] = useState(
    () => matchMedia('(max-width: 760px)').matches,
  );
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)'),
      update = () => setSmall(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return small;
}
function useSearchShortcut() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !document.querySelector('[role=dialog]') &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return ref;
}
function useSheetReturnFocus(id: string | undefined, fallback: () => void) {
  const lastId = useRef(id);
  useEffect(() => {
    if (id) lastId.current = id;
  }, [id]);
  return (event: Event) => {
    event.preventDefault();
    const key = lastId.current;
    const anchor = key
      ? document.querySelector<HTMLAnchorElement>(
          `a[href*="${CSS.escape(encodeURIComponent(key))}"]`,
        )
      : null;
    if (anchor) anchor.focus();
    else fallback();
  };
}
const ordinal = (n: number) =>
  `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`;
export function Orders() {
  const { state } = useData(),
    filters = useFilters(),
    navigate = useNavigate(),
    search = useSearchShortcut(),
    small = useSmallScreen();
  const history = state.kind === 'ready' ? state.file.orders : [];
  const orders = useMemo(
    () =>
      applyFilter(history, { ...filters, includeCancelled: true }).filter(
        (o) =>
          !filters.q ||
          [
            o.restaurant.name,
            ...o.restaurant.cuisines,
            ...o.items.map((i) => i.name),
            date(o.placedAt, true),
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(filters.q.toLocaleLowerCase()),
      ),
    [history, filters],
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'placedAt', desc: true },
  ]);
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: 'placedAt',
        accessorFn: (o) => Date.parse(o.placedAt),
        header: 'Date',
        cell: ({ row }) => (
          <Link to="/orders" search={{ ...filters, order: row.original.id }}>
            {date(row.original.placedAt)}
          </Link>
        ),
      },
      {
        id: 'restaurant',
        accessorFn: (o) => o.restaurant.name,
        header: 'Restaurant',
      },
      {
        id: 'dishes',
        accessorFn: (o) =>
          o.items.map((i) => `${i.quantity} × ${i.name}`).join(', '),
        header: 'Dishes',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="table-dishes">{String(getValue())}</span>
        ),
      },
      {
        id: 'total',
        accessorFn: (o) => o.money.total,
        header: 'Total',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {euros(row.original.money.total)}
          </span>
        ),
      },
      {
        id: 'fulfilment',
        accessorFn: (o) => o.fulfilment,
        header: 'Delivery or pickup',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.fulfilment}</Badge>
        ),
      },
      {
        id: 'company',
        accessorFn: (o) => (o.group.isGroup ? 'Group' : 'On your own'),
        header: 'Company',
        cell: ({ row }) => (
          <div className="row-badges">
            {row.original.group.isGroup ? (
              <Badge variant="secondary">Group</Badge>
            ) : (
              <span className="text-small">On your own</span>
            )}
            {row.original.status === 'cancelled' && (
              <Badge variant="outline">Cancelled</Badge>
            )}
          </div>
        ),
      },
    ],
    [filters],
  );
  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const tableHost = useRef<HTMLDivElement>(null),
    tableRows = table.getRowModel().rows,
    virtualize = tableRows.length > 200;
  const virtual = useVirtualizer({
    count: virtualize ? tableRows.length : 0,
    getScrollElement: () =>
      tableHost.current?.querySelector<HTMLDivElement>(
        '[data-slot=table-container]',
      ) ?? null,
    estimateSize: () => 56,
    overscan: 12,
  });
  const virtualItems = virtual.getVirtualItems();
  const visibleRows = virtualize
    ? virtualItems.flatMap((item) => {
        const row = tableRows[item.index];
        return row ? [{ row, index: item.index }] : [];
      })
    : tableRows.map((row, index) => ({ row, index }));
  const paddingTop = virtualize ? (virtualItems[0]?.start ?? 0) : 0,
    paddingBottom = virtualize
      ? Math.max(0, virtual.getTotalSize() - (virtualItems.at(-1)?.end ?? 0))
      : 0;
  const returnFocus = useSheetReturnFocus(filters.order, () =>
    search.current?.focus(),
  );
  const selected = history.find((o) => o.id === filters.order),
    visits = selected
      ? sorted(
          history.filter((o) => o.restaurant.id === selected.restaurant.id),
        )
      : [],
    nth = selected ? visits.findIndex((o) => o.id === selected.id) + 1 : 0;
  const detailFilters = [
    filters.restaurant,
    filters.weekday !== undefined,
    filters.hour !== undefined,
    filters.month,
    filters.date,
  ].some(Boolean);
  return (
    <section className="explorer" data-order-count={orders.length}>
      <div className="explorer-heading">
        <div>
          <h1 className="text-title">Every order</h1>
          <p className="text-lede">
            {plural(orders.length, 'order')}. A table with a very long memory.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (state.kind !== 'ready') return;
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(state.file)], {
                type: 'application/json',
              }),
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = 'order.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Save order.json
        </Button>
      </div>
      <div className="explorer-tools">
        <div className="search-field">
          <SearchIcon aria-hidden="true" />
          <Input
            ref={search}
            aria-label="Search orders"
            placeholder="Search a restaurant or dish…"
            value={filters.q ?? ''}
            onChange={(e) => {
              void navigate({
                to: '/orders',
                search: { ...filters, q: e.target.value || undefined },
                replace: true,
              });
            }}
          />
        </div>
        <ToggleGroup
          type="single"
          value={filters.fulfilment ?? 'all'}
          aria-label="Delivery or pickup"
          onValueChange={(v) => {
            if (v === 'all' || v === 'delivery' || v === 'pickup')
              void navigate({
                to: '/orders',
                search: { ...filters, fulfilment: v === 'all' ? undefined : v },
              });
          }}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="delivery">Delivery</ToggleGroupItem>
          <ToggleGroupItem value="pickup">Pickup</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="single"
          value={filters.company ?? 'all'}
          aria-label="Company"
          onValueChange={(v) => {
            if (v === 'all' || v === 'solo' || v === 'group')
              void navigate({
                to: '/orders',
                search: { ...filters, company: v === 'all' ? undefined : v },
              });
          }}
        >
          <ToggleGroupItem value="all">Everyone</ToggleGroupItem>
          <ToggleGroupItem value="solo">Solo</ToggleGroupItem>
          <ToggleGroupItem value="group">Group</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {detailFilters && (
        <div className="filter-notice">
          <span>
            Showing the part of your history you selected in the story.
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              void navigate({
                to: '/orders',
                search: { year: filters.year, home: filters.home },
              });
            }}
          >
            <X />
            Clear chart filters
          </Button>
        </div>
      )}
      <div ref={tableHost}>
        <Table aria-rowcount={tableRows.length + 1}>
          <TableHeader>
            {table.getHeaderGroups().map((g) => (
              <TableRow key={g.id}>
                {g.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    aria-sort={
                      h.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : h.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : undefined
                    }
                    className={h.id === 'total' ? 'money-cell' : undefined}
                  >
                    {h.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <ArrowUpDown />
                      </Button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={columns.length}
                  style={{ height: paddingTop, padding: 0 }}
                />
              </tr>
            )}
            {visibleRows.map(({ row, index }) => (
              <TableRow
                key={row.id}
                data-index={index}
                ref={virtualize ? virtual.measureElement : undefined}
                aria-rowindex={index + 2}
                className="order-row"
                onClick={(e) => {
                  if (e.target instanceof Element && e.target.closest('a'))
                    return;
                  void navigate({
                    to: '/orders',
                    search: { ...filters, order: row.original.id },
                  });
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === 'total' ? 'money-cell' : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={columns.length}
                  style={{ height: paddingBottom, padding: 0 }}
                />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
      {!orders.length && (
        <p className="empty-finding">
          No orders match this view. Try another search or clear the filters.
        </p>
      )}
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open)
            void navigate({
              to: '/orders',
              search: { ...filters, order: undefined },
            });
        }}
      >
        <SheetContent
          side={small ? 'bottom' : 'right'}
          className="detail-sheet"
          onCloseAutoFocus={returnFocus}
        >
          <SheetHeader>
            <SheetTitle>{selected?.restaurant.name ?? 'Order'}</SheetTitle>
            <SheetDescription>
              {selected ? date(selected.placedAt, true) : ''}
              {nth > 0 ? ` · Your ${ordinal(nth)} order from this place` : ''}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="sheet-body">
              <div className="row-badges">
                <Badge variant="secondary">{selected.fulfilment}</Badge>
                {selected.group.isGroup && (
                  <Badge variant="secondary">
                    Group
                    {selected.group.groupSize
                      ? ` of ${selected.group.groupSize}`
                      : ''}
                  </Badge>
                )}
                <Badge variant="outline">{selected.status}</Badge>
              </div>
              <h3 className="text-heading">Items</h3>
              <ul className="order-items">
                {selected.items.map((i, index) => (
                  <li key={index}>
                    <div>
                      <strong>
                        {i.quantity} × {i.name}
                      </strong>
                      {i.options.length > 0 && (
                        <span>{i.options.join(', ')}</span>
                      )}
                    </div>
                    <span>{euros(i.total)}</span>
                  </li>
                ))}
              </ul>
              <dl className="receipt">
                {[
                  { label: 'Food', value: selected.money.items },
                  { label: 'Delivery', value: selected.money.deliveryFee },
                  { label: 'Service fee', value: selected.money.serviceFee },
                  {
                    label: 'Small-order fee',
                    value: selected.money.smallOrderFee,
                  },
                  { label: 'Tip', value: selected.money.tip },
                  { label: 'Discount', value: -selected.money.discount },
                  { label: 'Adjustments', value: selected.money.adjustments },
                ]
                  .filter((v) => v.value !== 0)
                  .map((v) => (
                    <div key={v.label}>
                      <dt>{v.label}</dt>
                      <dd>{euros(v.value)}</dd>
                    </div>
                  ))}
                <div className="receipt-total">
                  <dt>Total order value</dt>
                  <dd>{euros(selected.money.total)}</dd>
                </div>
              </dl>
              <p className="text-small">
                {selected.payment ?? 'Payment method not recorded'}
              </p>
              <Link
                className="sheet-link"
                to="/places"
                search={{ place: selected.restaurant.id }}
              >
                More from this restaurant
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
export function Places() {
  const { state } = useData(),
    filters = useFilters(),
    navigate = useNavigate(),
    search = useSearchShortcut(),
    small = useSmallScreen();
  const history = state.kind === 'ready' ? state.file.orders : [],
    filtered = useMemo(() => applyFilter(history, filters), [history, filters]),
    places = useMemo(() => regulars(filtered).places, [filtered]),
    selected = regulars(history).places.find((p) => p.id === filters.place),
    visits = selected
      ? sorted(history.filter((o) => o.restaurant.id === selected.id))
      : [];
  const returnFocus = useSheetReturnFocus(filters.place, () =>
    search.current?.focus(),
  );
  return (
    <section className="explorer">
      <div className="explorer-heading">
        <div>
          <h1 className="text-title">Your places</h1>
          <p className="text-lede">
            {plural(places.length, 'restaurant')}. Some more familiar than
            others.
          </p>
        </div>
      </div>
      <div className="search-field place-search">
        <SearchIcon aria-hidden="true" />
        <Input
          ref={search}
          aria-label="Search restaurants"
          placeholder="Find a restaurant…"
          value={filters.q ?? ''}
          onChange={(e) => {
            void navigate({
              to: '/places',
              search: { ...filters, q: e.target.value || undefined },
              replace: true,
            });
          }}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Restaurant</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Your usual time</TableHead>
            <TableHead className="money-cell">Order value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {places
            .filter(
              (p) =>
                !filters.q ||
                p.name.toLowerCase().includes(filters.q.toLowerCase()),
            )
            .map((p) => (
              <TableRow
                key={p.id}
                className="order-row"
                onClick={(e) => {
                  if (e.target instanceof Element && e.target.closest('a'))
                    return;
                  void navigate({
                    to: '/places',
                    search: { ...filters, place: p.id },
                  });
                }}
              >
                <TableCell>
                  <Link to="/places" search={{ ...filters, place: p.id }}>
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{p.count}</TableCell>
                <TableCell>
                  {weekdays[p.typical.weekday]} around {time(p.typical.hour)}
                </TableCell>
                <TableCell className="money-cell">{euros(p.spend)}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open)
            void navigate({
              to: '/places',
              search: { ...filters, place: undefined },
            });
        }}
      >
        <SheetContent
          side={small ? 'bottom' : 'right'}
          className="detail-sheet"
          onCloseAutoFocus={returnFocus}
        >
          <SheetHeader>
            <SheetTitle>{selected?.name ?? 'Restaurant'}</SheetTitle>
            <SheetDescription>
              {selected
                ? `${plural(selected.count, 'order')} · ${selected.first ? date(selected.first, true) : ''} to ${selected.last ? date(selected.last, true) : ''}`
                : ''}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="sheet-body">
              <p className="text-lede">
                Usually {weekdays[selected.typical.weekday]} around{' '}
                {time(selected.typical.hour)}.
              </p>
              <h3 className="text-heading">Your usual</h3>
              <p className="text-body">{selected.usual}</p>
              <Lifetime
                visits={selected.visits}
                first={history[0]?.placedAt ?? selected.first ?? ''}
                last={history.at(-1)?.placedAt ?? selected.last ?? ''}
              />
              <h3 className="text-heading">Every visit</h3>
              <ul className="place-visits">
                {[...visits].reverse().map((o) => (
                  <li key={o.id}>
                    <Link to="/orders" search={{ order: o.id }}>
                      {date(o.placedAt)}
                    </Link>
                    <span>{euros(o.money.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
