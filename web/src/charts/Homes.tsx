import { useData, useHomeName } from '@/data/provider';
import { useState } from 'react';
import { homes } from '@core/analyze/homes';
import { weekdays } from '@core/analyze/shared';
import type { Order } from '@core/schema';
import { month, euros, time, plural } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chapter, Figure, hrefFor } from './primitives';
import { useFilters } from '@/lib/search';
function HomePanel({
  home: h,
  index,
}: {
  home: ReturnType<typeof homes>[number];
  index: number;
}) {
  const { renameHome } = useData(),
    homeName = useHomeName(),
    name = homeName(h.key);
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(name),
    filters = useFilters();
  return (
    <div className="home-panel">
      <a
        className="home-doorstep"
        href={hrefFor({ ...filters, home: h.key })}
        aria-label={`Explore ${plural(h.count, 'order')} at ${name}`}
      >
        <svg viewBox="0 0 240 156" aria-hidden="true">
          <path
            d={
              index % 3 === 0
                ? 'M42 144V55L120 12L198 55V144'
                : index % 3 === 1
                  ? 'M42 144V24H198V144'
                  : 'M42 144V48H68V30H94V12H146V30H172V48H198V144'
            }
            fill="none"
            stroke="var(--m-line-strong)"
            strokeWidth="1.5"
          />
          <path
            d="M26 144H214M63 79H92V109H63ZM148 79H177V109H148ZM77 79V109M162 79V109M63 94H92M148 94H177"
            fill="none"
            stroke="var(--m-line-strong)"
            strokeWidth="1.5"
          />
          <path
            className="door-fill"
            d="M104 144V80Q120 68 136 80V144Z"
            fill="var(--m-surface)"
            stroke="var(--m-ink-soft)"
            strokeWidth="1.5"
          />
          <circle cx="128" cy="115" r="2" fill="var(--m-ink-soft)" />
          <text
            x="120"
            y="57"
            textAnchor="middle"
            fill="var(--m-ink)"
            fontSize="22"
          >
            {h.count}
          </text>
          <text
            x="120"
            y="71"
            textAnchor="middle"
            fill="var(--m-ink-faint)"
            fontSize="13"
          >
            dinners here
          </text>
        </svg>
      </a>
      <div className="home-heading">
        <h3>{name}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(name);
            setEditing((v) => !v);
          }}
        >
          Rename
        </Button>
      </div>
      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = draft.trim() || name;
            renameHome(h.key, value);
            setEditing(false);
          }}
        >
          <Input
            value={draft}
            maxLength={60}
            aria-label="Home name"
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit">Save name</Button>
        </form>
      )}
      <p className="home-city">{h.city}</p>
      <p className="home-dates">
        {h.first ? month(h.first) : ''}
        {h.last && h.first && month(h.last) !== month(h.first)
          ? ` to ${month(h.last)}`
          : ''}
      </p>
      <p className="home-rate">
        <strong className="text-stat">{h.ordersPerWeek.toFixed(1)}</strong>{' '}
        orders a week
      </p>
      <dl>
        <div>
          <dt>Your regular</dt>
          <dd>{h.restaurant}</dd>
        </div>
        <div>
          <dt>Most often</dt>
          <dd>{h.cuisine}</dd>
        </div>
        <div>
          <dt>Your usual time</dt>
          <dd>
            {weekdays[h.typical.weekday]} around {time(h.typical.hour)}
          </dd>
        </div>
        <div>
          <dt>Average basket</dt>
          <dd>{euros(h.averageOrder)}</dd>
        </div>
      </dl>
      <a href={hrefFor({ ...filters, home: h.key })}>
        {plural(h.count, 'order')} at this home
      </a>
    </div>
  );
}
export function HomesChapter({ orders }: { orders: Order[] }) {
  const homeName = useHomeName(),
    h = homes(orders),
    most = [...h].sort((a, b) => b.ordersPerWeek - a.ordersPerWeek)[0];
  return (
    <Chapter
      id="homes"
      title="Homes"
      lede={
        h.length > 1 ? (
          <>
            Your busiest doorstep was {most ? homeName(most.key) : 'this home'},
            with {most?.ordersPerWeek.toFixed(1)} orders a week.
          </>
        ) : (
          <>
            One delivery area, {plural(h[0]?.count ?? 0, 'order')}. Your usual
            there is {h[0]?.restaurant ?? 'still taking shape'}.
          </>
        )
      }
    >
      <Figure
        caption="Same doorstep, different dinners. Street labels come from your private local history; you can rename any home."
        headers={['Home', 'City', 'Orders', 'Orders a week', 'Average']}
        rows={h.map((v) => [
          homeName(v.key),
          v.city,
          v.count,
          v.ordersPerWeek.toFixed(1),
          euros(v.averageOrder),
        ])}
      >
        <div className="home-panels">
          {h.map((home, index) => (
            <HomePanel key={home.key} home={home} index={index} />
          ))}
        </div>
      </Figure>
    </Chapter>
  );
}
