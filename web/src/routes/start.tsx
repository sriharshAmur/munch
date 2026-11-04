import { useEffect, useRef, useState } from 'react';
import { OrdersFileSchema } from '@core/schema';
import { noticed } from '@core/analyze/noticed';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useData } from '@/data/provider';
import { tickets, TicketCard, type Ticket } from '@/story/Rail';

const wanted = ['ritual', 'ghosted', 'inflation'];

/** Three of the made-up person's tickets, fanned out beside the invitation. */
function Preview() {
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
export function Start() {
  const { loadDemo, openFile, state } = useData(),
    navigate = useNavigate(),
    input = useRef<HTMLInputElement>(null);
  return (
    <section
      className="start"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) void openFile(f).then(() => navigate({ to: '/', search: {} }));
      }}
    >
      <Preview />
      <h1 className="text-display">
        There’s a story
        <br />
        in your usual.
      </h1>
      <p className="text-lede">
        Your Friday evenings. The place you always come back to. A year of
        dinners, seen together.
      </p>
      <div className="start-actions">
        <Button
          onClick={() => {
            void loadDemo().then(() => navigate({ to: '/', search: {} }));
          }}
        >
          See the demo
        </Button>
        <Button variant="outline" onClick={() => input.current?.click()}>
          Open my orders.json
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        accept=".json,application/json"
        className="sr-only"
        aria-label="Choose orders file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void openFile(f).then(() => navigate({ to: '/', search: {} }));
        }}
      />
      {state.kind === 'empty' && state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
      <p className="text-body">
        Your file stays in this browser. Nothing is uploaded.
      </p>
      <details>
        <summary>How do I get my orders?</summary>
        <p className="text-body">
          Run <code>bun run munch probe orders</code> with your own signed-in
          browser session. Then run munch fetch and munch build to make your
          orders file. You can also explore the demo first.
        </p>
      </details>
    </section>
  );
}
