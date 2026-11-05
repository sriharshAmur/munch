import { useEffect, useState } from 'react';
import { OrdersFileSchema } from '@core/schema';
import { noticed } from '@core/analyze/noticed';
import { tickets, TicketCard, type Ticket } from '@/story/tickets';

const wanted = ['ritual', 'ghosted', 'inflation'];

/** Three of the made-up person's tickets, fanned out beside the invitation. */
export function Preview() {
  const [list, setList] = useState<Ticket[]>([]);
  useEffect(() => {
    let live = true;
    void fetch(`${import.meta.env.BASE_URL}demo/orders.json`)
      .then((r) => r.json())
      .then((v) => {
        const file = OrdersFileSchema.parse(v);
        const all = tickets(noticed(file.orders, file.generatedAt), file.orders, file.generatedAt, () => 'Home');
        if (live) setList(wanted.flatMap((k) => all.filter((t) => t.key === k)));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="start-preview" aria-hidden="true" inert>
      {list.map((t, i) => (
        <div key={t.key} className="start-ticket" style={{ '--n': i } as React.CSSProperties}>
          <TicketCard ticket={t} tilt={[-6, 3, -2][i] ?? 0} />
        </div>
      ))}
    </div>
  );
}
