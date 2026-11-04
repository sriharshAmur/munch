import { scaleLinear } from 'd3-scale';
import { local } from '@core/analyze/shared';
import { date, time } from '@/lib/format';
import { Mark, useSize, Interactive } from './primitives';
export function Lifetime({
  visits,
  first,
  last,
}: {
  visits: string[];
  first: string;
  last: string;
}) {
  const { ref, width } = useSize(),
    x = scaleLinear()
      .domain([
        Date.parse(first),
        Math.max(Date.parse(last), Date.parse(first) + 1),
      ])
      .range([1, width - 1]);
  return (
    <div ref={ref}>
      <Interactive>
        <svg
          width={width}
          height="18"
          aria-label="Every visit on a lifetime strip"
        >
          <line x1="0" x2={width} y1="9" y2="9" stroke="var(--m-line)" />
          {visits.map((v, i) => (
            <Mark
              key={i}
              index={i}
              title={date(v, true)}
              detail={`Order at ${time(local(v).hour)}`}
              search={{ date: local(v).date }}
            >
              <rect
                x={x(Date.parse(v)) - 4}
                y="0"
                width="8"
                height="18"
                fill="transparent"
              />
              <line
                x1={x(Date.parse(v))}
                x2={x(Date.parse(v))}
                y1="3"
                y2="15"
                stroke="var(--m-data-1)"
                strokeWidth="1"
              />
            </Mark>
          ))}
        </svg>
      </Interactive>
    </div>
  );
}
