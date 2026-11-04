import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@tanstack/react-router';
import { useFilters, type Search } from '@/lib/search';
export function hrefFor(search: Search = {}, route = '/orders') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search))
    if (value !== undefined) params.set(key, String(value));
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${route}${params.size ? '?' + params : ''}`;
}
export function useSize() {
  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
type Tip = { x: number; y: number; title: string; detail: string } | null;
const Context = createContext<{
  tip: Tip;
  setTip: (tip: Tip) => void;
  active: number;
  setActive: (index: number) => void;
}>({ tip: null, setTip: () => {}, active: 0, setActive: () => {} });
export function ChartTooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return createPortal(
    <div
      className="chart-tooltip"
      role="tooltip"
      style={{
        left: Math.max(12, Math.min(tip.x + 14, window.innerWidth - 272)),
        top: Math.max(12, Math.min(tip.y + 14, window.innerHeight - 100)),
      }}
    >
      <strong>{tip.title}</strong>
      <span>{tip.detail}</span>
      <span className="tooltip-hint">Press to explore</span>
    </div>,
    document.body,
  );
}
export function Interactive({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip>(null),
    [active, setActive] = useState(0);
  return (
    <Context.Provider value={{ tip, setTip, active, setActive }}>
      <div className="interactive-chart" onPointerLeave={() => setTip(null)}>
        {children}
      </div>
      <ChartTooltip tip={tip} />
    </Context.Provider>
  );
}
export function Mark({
  index,
  title,
  detail = '',
  search = {},
  route = '/orders',
  children,
}: {
  index: number;
  title: string;
  detail?: string;
  search?: Search;
  route?: string;
  children: ReactNode;
}) {
  const ctx = useContext(Context),
    base = useFilters(),
    navigate = useNavigate();
  function keys(e: KeyboardEvent<Element>) {
    if (
      ![
        'ArrowRight',
        'ArrowLeft',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
        'Escape',
      ].includes(e.key)
    )
      return;
    if (e.key === 'Escape') {
      ctx.setTip(null);
      return;
    }
    e.preventDefault();
    const marks = Array.from(
        e.currentTarget
          .closest('.interactive-chart')
          ?.querySelectorAll<Element>('[data-mark]') ?? [],
      ),
      at = marks.indexOf(e.currentTarget),
      direction = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? marks.length - 1
          : (at + direction + marks.length) % marks.length;
    const target = marks[next];
    if (target instanceof SVGElement || target instanceof HTMLElement)
      target.focus();
  }
  return (
    <a
      href={hrefFor({ ...base, ...search }, route)}
      data-mark=""
      tabIndex={ctx.active === index ? 0 : -1}
      aria-label={`${title}. ${detail}`}
      onKeyDown={keys}
      onClick={(e) => {
        // Stay in the app: the router swaps the page without a reload.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        ctx.setTip(null);
        void navigate({ to: route, search: { ...base, ...search } });
      }}
      onPointerMove={(e) =>
        ctx.setTip({ x: e.clientX, y: e.clientY, title, detail })
      }
      onFocus={(e) => {
        ctx.setActive(index);
        const box = e.currentTarget.getBoundingClientRect();
        ctx.setTip({ x: box.x + box.width / 2, y: box.y, title, detail });
      }}
      onBlur={() => ctx.setTip(null)}
    >
      {children}
    </a>
  );
}
