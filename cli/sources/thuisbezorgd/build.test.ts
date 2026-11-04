import { test, expect } from 'bun:test';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from './build';
import { fakeDetail } from './fixture';
import { OrdersFileSchema } from '../../../core/schema';
test('keeps an owned captured order missing from history and deduplicates repeated orders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'munch-build-'));
  try {
    await mkdir(join(root, 'orders'));
    await mkdir(join(root, 'pages'));
    await mkdir(join(root, 'probes'));
    await Bun.write(
      join(root, 'pages/first.json'),
      JSON.stringify({ consumerId: 'fake-consumer' }),
    );
    await Bun.write(join(root, 'orders/a.json'), JSON.stringify(fakeDetail));
    await Bun.write(
      join(root, 'orders/duplicate.json'),
      JSON.stringify(fakeDetail),
    );
    await Bun.write(
      join(root, 'probes/order-detail.json'),
      JSON.stringify({ ...fakeDetail, id: 'another-fake-order' }),
    );
    const output = join(root, 'built.json');
    await build({ rawRoot: root, output });
    const file = OrdersFileSchema.parse(await Bun.file(output).json());
    expect(file.orders).toHaveLength(2);
    expect(new Set(file.orders.map((o) => o.id)).size).toBe(2);
    expect(JSON.stringify(file)).not.toContain('Not retained');
    await Bun.write(
      join(root, 'probes/order-detail.json'),
      JSON.stringify({
        ...fakeDetail,
        id: 'other-order',
        consumer: { ...fakeDetail.consumer, id: 'another-consumer' },
      }),
    );
    await build({ rawRoot: root, output });
    expect(
      OrdersFileSchema.parse(await Bun.file(output).json()).orders,
    ).toHaveLength(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('keeps street labels in a private sidecar and separates houses within one postcode', async () => {
  const root = await mkdtemp(join(tmpdir(), 'munch-homes-'));
  try {
    await mkdir(join(root, 'orders'));
    for (const [id, street] of [
      ['first', 'Imaginary Lane 12'],
      ['second', 'Imaginary Lane 14'],
    ]) {
      await Bun.write(
        join(root, `orders/${id}.json`),
        JSON.stringify({
          ...fakeDetail,
          id,
          consumer: {
            ...fakeDetail.consumer,
            deliveryAddress: {
              ...fakeDetail.consumer.deliveryAddress,
              addressLines: [street],
            },
          },
        }),
      );
    }
    const output = join(root, 'built.json');
    await build({ rawRoot: root, output });
    const text = await Bun.file(output).text(),
      file = OrdersFileSchema.parse(JSON.parse(text));
    expect(new Set(file.orders.map((o) => o.home.key)).size).toBe(2);
    expect(text).not.toContain('Imaginary Lane');
    const labels = await Bun.file(join(root, 'home-labels.json')).json();
    expect(Object.values(labels.names).sort()).toEqual([
      'Imaginary Lane 12',
      'Imaginary Lane 14',
    ]);
    expect(labels.ordersGeneratedAt).toBe(file.generatedAt);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
