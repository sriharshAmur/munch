import { z } from 'zod';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdir, rename } from 'node:fs/promises';
import { privateHome } from './home';
import { HomeLabelsSchema } from '../../../core/home-labels';
import { normalizeDetail } from './normalize';
import { OrdersFileSchema, type Order } from '../../../core/schema';

export async function build({
  rawRoot = 'data/raw/thuisbezorgd',
  output = 'data/orders.json',
}: { rawRoot?: string; output?: string } = {}) {
  const paths = [
    ...(existsSync(`${rawRoot}/orders`)
      ? new Bun.Glob('*.json').scanSync(`${rawRoot}/orders`)
      : []),
  ].map((name) => `${rawRoot}/orders/${name}`);
  const probe = `${rawRoot}/probes/order-detail.json`;
  if (await Bun.file(probe).exists()) {
    let include = paths.length === 0;
    if (paths.length) {
      const ownerSchema = z.object({ consumer: z.object({ id: z.string() }) });
      const probeOwner = ownerSchema.safeParse(await Bun.file(probe).json());
      const pageFile = Bun.file(`${rawRoot}/pages/first.json`);
      let currentOwner: string | null = null;
      if (await pageFile.exists()) {
        const page = z
          .object({ consumerId: z.string() })
          .safeParse(await pageFile.json());
        if (page.success) currentOwner = page.data.consumerId;
      } else {
        const first = paths[0];
        if (first) {
          const record = ownerSchema.safeParse(await Bun.file(first).json());
          if (record.success) currentOwner = record.data.consumer.id;
        }
      }
      include =
        probeOwner.success && probeOwner.data.consumer.id === currentOwner;
    }
    if (include) paths.unshift(probe);
  }
  if (!paths.length)
    throw Error('No stored orders yet. Run munch fetch first.');
  const orders: Order[] = [];
  const labels = new Map<string, string>();
  const problems = new Map<string, number>();
  for (const path of paths) {
    try {
      const input: unknown = await Bun.file(path).json();
      const home = privateHome(input);
      orders.push(normalizeDetail(input, home.key));
      if (home.label) labels.set(home.key, home.label);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not parse a stored order.';
      problems.set(message, (problems.get(message) ?? 0) + 1);
    }
  }
  if (problems.size) {
    process.stdout.write(
      `Orders parsed: ${orders.length}. Problems: ${paths.length - orders.length}.\n`,
    );
    for (const [message, count] of problems)
      process.stdout.write(`${count} orders: ${message}\n`);
    throw Error('Build stopped. The previous orders file was kept.');
  }
  const unique = [...new Map(orders.map((o) => [o.id, o])).values()].sort(
    (a, b) => Date.parse(a.placedAt) - Date.parse(b.placedAt),
  );
  const file = OrdersFileSchema.parse({
    version: 1,
    source: 'thuisbezorgd',
    generatedAt: new Date().toISOString(),
    orders: unique,
  });
  await mkdir(dirname(output), { recursive: true });
  const names = Object.fromEntries(
    [...new Set(unique.map((o) => o.home.key))].flatMap((key) => {
      const label = labels.get(key);
      return label ? [[key, label]] : [];
    }),
  );
  const metadata = HomeLabelsSchema.parse({
    version: 1,
    source: file.source,
    ordersGeneratedAt: file.generatedAt,
    names,
  });
  const namesPath = `${dirname(output)}/home-labels.json`;
  await Bun.write(`${namesPath}.next`, JSON.stringify(metadata));
  await rename(`${namesPath}.next`, namesPath);
  await Bun.write(`${output}.next`, JSON.stringify(file));
  await rename(`${output}.next`, output);
  process.stdout.write(`Built ${unique.length} orders.\n`);
}
