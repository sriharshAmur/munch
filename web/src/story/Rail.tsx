import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Order } from '@core/schema';
import type { Finding } from '@core/analyze/noticed';
import { useFilters } from '@/lib/search';
import { useReducedMotion } from './palette';
// The tickets live apart from the rail, so the start page can show three without loading motion.
import { tickets, TicketCard } from './tickets';

export function Rail({
  found,
  orders,
  now,
  homeName,
}: {
  found: Finding[];
  orders: Order[];
  now: string;
  homeName: (key: string) => string;
}) {
  const filters = useFilters();
  const reduced = useReducedMotion();
  const list = tickets(found, orders, now, homeName);
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  if (!list.length) return null;
  const scroll = (direction: number) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  return (
    <section className="rail" aria-labelledby="rail-title">
      <div className="rail-head">
        <div>
          <h2 id="rail-title" className="section-title">
            Things we noticed
          </h2>
          <p className="section-lede">
            {list.length === 1 ? 'One small thing' : `${list.length} small things`} hiding in your orders, pinned up like
            tickets in a kitchen.
          </p>
        </div>
        <div className="rail-buttons">
          <button type="button" aria-label="Previous tickets" disabled={edge.start} onClick={() => scroll(-1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next tickets" disabled={edge.end} onClick={() => scroll(1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="rail-track"
        ref={track}
        tabIndex={0}
        aria-label="Tickets, scroll sideways"
        onScroll={(e) => {
          const el = e.currentTarget;
          setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
        }}
      >
        <ul>
          {list.map((t, i) => (
            <motion.li
              key={t.key}
              initial={reduced ? false : { opacity: 0, transform: 'translateY(-32px)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
              viewport={{ once: true, margin: '0px -5% 0px 0px' }}
              transition={{ type: 'spring', duration: 0.7, bounce: 0.25, delay: Math.min(i, 4) * 0.04 }}
            >
              <TicketCard ticket={t} tilt={((i * 37) % 5) - 2} search={filters} />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
