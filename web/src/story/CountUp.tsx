import { useLayoutEffect, useRef } from 'react';
import { animate, useInView } from 'motion/react';

/** A number that counts up once, the first time it comes into view. */
export function CountUp({
  value,
  reduced,
  format = (v) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(v),
  duration = 1.6,
}: {
  value: number;
  reduced: boolean;
  format?: (v: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  // The digits are written straight into the element, so React never owns that text.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || !seen) {
      el.textContent = format(reduced ? value : 0);
      if (reduced) return;
      if (!seen) return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [value, reduced, seen]); // eslint-disable-line react-hooks/exhaustive-deps
  // Screen readers get the final value, never the counting.
  return (
    <span className="count">
      <span ref={ref} aria-hidden="true" />
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
