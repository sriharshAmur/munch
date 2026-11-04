import type { CSSProperties, ReactNode } from 'react';
import type { Search } from '@/lib/search';
import { Interactive, Mark } from './primitives';
import { useSeen } from './useSeen';

export type Bar = {
  key: string;
  value: number;
  /** The tooltip's first line, and the accessible name. */
  title: string;
  detail: string;
  /** A label under the bar; leave empty to keep the axis quiet. */
  tick?: string;
  /** Highlighted in the lamp colour; the rest stay quiet. */
  lit?: boolean;
  /** Shown above the bar. */
  label?: ReactNode;
  /** Stacked parts, bottom first, each in a categorical slot. */
  parts?: { value: number; slot: number }[];
  search?: Search;
  route?: string;
};

/**
 * Plain columns on one baseline. Every column is a link into the explorer with a
 * tooltip, and the bars grow up from the baseline the first time they are seen.
 */
export function Bars({
  bars,
  height = 168,
  label,
  gap = 3,
  dense = false,
}: {
  bars: Bar[];
  /** Pixels, or 'fill' to take whatever room the card has left. */
  height?: number | 'fill';
  label: string;
  gap?: number;
  dense?: boolean;
}) {
  const { ref, seen } = useSeen<HTMLDivElement>();
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div ref={ref} className="bars-wrap" data-seen={seen} data-dense={dense} data-fill={height === 'fill'}>
      <Interactive>
        <div
          className="bars"
          role="group"
          aria-label={label}
          style={{ '--cols': bars.length, '--gap': `${gap}px`, height: height === 'fill' ? undefined : height } as CSSProperties}
        >
          {bars.map((b, i) => (
            <Mark key={b.key} index={i} title={b.title} detail={b.detail} search={b.search} route={b.route}>
              <span className="bar" data-lit={b.lit ?? false} data-empty={b.value === 0} style={{ '--i': i } as CSSProperties}>
                {b.label !== undefined && (
                  <span className="bar-label" style={{ bottom: `${(b.value / max) * 100}%` }}>
                    {b.label}
                  </span>
                )}
                <span className="bar-fill" data-parts={Boolean(b.parts?.length)} style={{ height: `${(b.value / max) * 100}%` }}>
                  {b.parts && b.parts.length > 0
                    ? b.parts.map((p, k) => (
                        <i
                          key={k}
                          style={{ flexGrow: p.value, background: `var(--m-data-${p.slot})` } as CSSProperties}
                        />
                      ))
                    : null}
                </span>
              </span>
            </Mark>
          ))}
        </div>
        <div className="bars-ticks" aria-hidden="true" style={{ '--cols': bars.length, '--gap': `${gap}px` } as CSSProperties}>
          {bars.map((b) => (
            <span key={b.key}>{b.tick ?? ''}</span>
          ))}
        </div>
      </Interactive>
    </div>
  );
}
