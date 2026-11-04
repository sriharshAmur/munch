import { useId, useState, type ReactNode } from 'react';
import { number } from '@/lib/format';

export type Numbers = { headers: string[]; rows: (string | number)[][] };

/**
 * One question about your orders: the question, its answer in large type, a
 * sentence of context and the evidence. Every figure can turn into its table.
 */
export function Card({
  question,
  answer,
  note,
  span = 4,
  tools,
  numbers,
  foot,
  children,
}: {
  question: string;
  answer: ReactNode;
  note?: ReactNode;
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  tools?: ReactNode;
  numbers?: Numbers;
  foot?: ReactNode;
  children: ReactNode;
}) {
  const [table, setTable] = useState(false);
  const id = useId();
  return (
    <section className="card" data-span={span} aria-labelledby={id}>
      <header className="card-head">
        <div>
          <h2 id={id} className="card-question">
            {question}
          </h2>
          <p className="card-answer">{answer}</p>
          {note && <p className="card-note">{note}</p>}
        </div>
        {tools && <div className="card-tools">{tools}</div>}
      </header>
      <div className="card-figure" data-table={table}>
        {table && numbers ? (
          <div className="card-table">
            <table>
              <thead>
                <tr>
                  {numbers.headers.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numbers.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j}>{typeof v === 'number' ? number(v) : v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
      {(foot || numbers) && (
        <div className="card-foot">
          {foot}
          {numbers && (
            <button type="button" className="card-flip" aria-pressed={table} onClick={() => setTable(!table)}>
              {table ? 'Show the chart' : 'Show the numbers'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
