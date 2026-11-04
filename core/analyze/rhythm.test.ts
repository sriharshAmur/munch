import { expect, test } from 'bun:test';
import { generateDemo } from '../../demo/generate';
import type { Order } from '../schema';
import { applyFilter, availableYears, availableHomes } from './filter';
import { summary } from './summary';
import { rhythm } from './rhythm';
import { timeline } from './timeline';
import { regulars } from './regulars';
import { dishes } from './dishes';
import { company } from './company';
import { calendar } from './calendar';
import { homes } from './homes';
import { novelty } from './novelty';
import { cost } from './cost';
import { local } from './shared';
const demo = generateDemo().orders;
const base = demo[0];
if (!base) throw Error('Demo fixture is empty');
const fake = (
  id: string,
  placedAt: string,
  overrides: Partial<Order> = {},
): Order => ({
  ...base,
  id: `demo:${id}`,
  placedAt,
  status: 'delivered',
  restaurant: { id: 'a', name: 'Imaginary Spoon', cuisines: ['Thai'] },
  money: {
    items: 1000,
    deliveryFee: 100,
    serviceFee: 0,
    smallOrderFee: 0,
    tip: 0,
    discount: 0,
    adjustments: 0,
    total: 1100,
    currency: 'EUR',
  },
  group: { isGroup: false, groupSize: null },
  ...overrides,
});
const a = fake('a', '2024-01-01T23:30:00+00:00'),
  b = fake('b', '2024-01-03T19:00:00+01:00'),
  c = fake('c', '2024-01-04T20:00:00+01:00', {
    restaurant: { id: 'b', name: 'Invented Rice', cuisines: ['Sushi'] },
    group: { isGroup: true, groupSize: 3 },
  }),
  cancelled = fake('x', '2023-01-01T10:00:00+01:00', { status: 'cancelled' });
const small = [a, b, c, cancelled];
test('rhythm puts an offset timestamp on the next local day', () => {
  expect(rhythm([a]).matrix[1]?.[0]?.count).toBe(1);
  expect(rhythm([b, c]).peakShare).toBe(1);
});
