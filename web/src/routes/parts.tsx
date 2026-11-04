import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search as SearchIcon, X } from 'lucide-react';
import type { Search } from '@/lib/search';
import { date, day, euros, monthKey } from '@/lib/format';
import { weekdays } from '@core/analyze/shared';

export function useSmallScreen() {
  const [small, setSmall] = useState(() => matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)'),
      update = () => setSmall(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return small;
}

/** "/" jumps to the search, as on most sites with one. */
export function useSearchShortcut() {
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
        ref.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return ref;
}

/** When a sheet closes, focus goes back to the row that opened it. */
export function useSheetReturnFocus(id: string | undefined, fallback: () => void) {
  const lastId = useRef(id);
  useEffect(() => {
    if (id) lastId.current = id;
  }, [id]);
  return (event: Event) => {
    event.preventDefault();
    const key = lastId.current;
    const anchor = key ? document.querySelector<HTMLAnchorElement>(`a[href*="${CSS.escape(encodeURIComponent(key))}"]`) : null;
    if (anchor) anchor.focus();
    else fallback();
  };
}

export const ordinal = (n: number) =>
  `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`;

export function SearchBox({
  value,
  onChange,
  label,
  placeholder,
  inputRef,
  result,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  inputRef: RefObject<HTMLInputElement | null>;
  result?: string;
}) {
  // Typing stays instant; the URL catches up a moment later.
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return;
    const t = window.setTimeout(() => onChange(text), 120);
    return () => window.clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="search" data-filled={Boolean(text)}>
      <SearchIcon aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && text) {
            e.preventDefault();
            setText('');
            onChange('');
          }
        }}
      />
      {text ? (
        <button
          type="button"
          className="search-clear"
          aria-label="Clear the search"
          onClick={() => {
            setText('');
            onChange('');
            inputRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </button>
      ) : (
        <kbd aria-hidden="true">/</kbd>
      )}
      {result !== undefined && (
        <span className="sr-only" role="status">
          {result}
        </span>
      )}
    </div>
  );
}

/** The words of a search, marked wherever they appear in the text. */
export function Highlight({ text, query }: { text: string; query?: string }) {
  const words = (query ?? '')
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'));
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}
    </>
  );
}

const chipKeys = ['year', 'home', 'restaurant', 'month', 'week', 'date', 'weekday', 'hour', 'min', 'fulfilment', 'company'] as const;
type ChipKey = (typeof chipKeys)[number];

/** Every filter in force, each one removable on its own. */
export function FilterChips({
  filters,
  route,
  homeName,
  placeName,
}: {
  filters: Search;
  route: '/orders' | '/places' | '/';
  homeName: (key: string) => string;
  placeName: (id: string) => string;
}) {
  const navigate = useNavigate();
  const label = (key: ChipKey): string | null => {
    const f = filters;
    switch (key) {
      case 'year':
        return f.year !== undefined ? String(f.year) : null;
      case 'home':
        return f.home ? homeName(f.home) : null;
      case 'restaurant':
        return f.restaurant ? placeName(f.restaurant) : null;
      case 'month':
        return f.month ? monthKey(f.month) : null;
      case 'week':
        return f.week ? `Week of ${day(f.week)}` : null;
      case 'date':
        return f.date ? date(f.date, true) : null;
      case 'weekday':
        return f.weekday !== undefined ? `${weekdays[f.weekday]}s` : null;
      case 'hour':
        return f.hour !== undefined
          ? `${String(f.hour).padStart(2, '0')}:00 to ${String((f.hour + 1) % 24).padStart(2, '0')}:00`
          : null;
      case 'min':
        return f.min !== undefined
          ? f.max !== undefined
            ? `${euros(f.min, true)} to ${euros(f.max, true)}`
            : `${euros(f.min, true)} or more`
          : null;
      case 'fulfilment':
        return f.fulfilment === 'pickup' ? 'Pickup' : f.fulfilment === 'delivery' ? 'Delivery' : null;
      case 'company':
        return f.company === 'group' ? 'Group orders' : f.company === 'solo' ? 'On your own' : null;
    }
  };
  const chips = chipKeys.flatMap((key) => {
    const text = label(key);
    return text ? [{ key, text }] : [];
  });
  if (!chips.length) return null;
  const without = (key: ChipKey): Search => ({ ...filters, [key]: undefined, ...(key === 'min' ? { max: undefined } : {}) });
  return (
    <div className="chips" role="group" aria-label="Filters in use">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          className="chip"
          aria-label={`Remove the filter ${c.text}`}
          onClick={() => void navigate({ to: route, search: without(c.key) })}
        >
          <span>{c.text}</span>
          <X aria-hidden="true" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          className="chip-clear"
          onClick={() => void navigate({ to: route, search: { q: filters.q } })}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/** A small row of facts about what is on screen. */
export function Summary({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="summary">
      {items.map((i) => (
        <div key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
