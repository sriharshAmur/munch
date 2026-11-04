import type { CSSProperties } from 'react';

const initials = (name: string) => {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(the|de|het|la|le|el|il|a)$/i.test(w));
  const letters = (words.length > 1 ? [words[0], words[1]] : [words[0] ?? name]).map((w) => [...(w ?? '')][0] ?? '');
  return letters.join('').toLocaleUpperCase() || '·';
};
/** One of the six categorical slots, always the same one for the same restaurant. */
export const slotFor = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 6) + 1;
};

/** A restaurant's initials on a tint of its own colour, so a row is recognisable at a glance. */
export function Monogram({ id, name, size = 36 }: { id: string; name: string; size?: number }) {
  return (
    <span
      className="monogram"
      aria-hidden="true"
      style={{ '--slot': `var(--m-data-${slotFor(id)})`, '--size': `${size}px` } as CSSProperties}
    >
      {initials(name)}
    </span>
  );
}
