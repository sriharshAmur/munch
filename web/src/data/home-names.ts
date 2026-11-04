import { HomeLabelsSchema } from '@core/home-labels';
import type { OrdersFile } from '@core/schema';
export async function loadHomeNames(
  file: OrdersFile,
  demo: boolean,
): Promise<Record<string, string>> {
  let names: Record<string, string> = {};
  if (demo || import.meta.env.DEV) {
    try {
      const response = await fetch(
        demo ? '/demo/homes.json' : '/local/homes.json',
      );
      if (response.ok) {
        const metadata = HomeLabelsSchema.parse(await response.json());
        if (
          metadata.source === file.source &&
          metadata.ordersGeneratedAt === file.generatedAt
        )
          names = metadata.names;
      }
    } catch {
      /* A label file is optional; orders still load. */
    }
  }
  for (const key of new Set(file.orders.map((o) => o.home.key))) {
    const custom = localStorage.getItem(
      `munch-home-${demo ? 'demo' : 'local'}-${key}`,
    );
    if (custom?.trim()) names[key] = custom.trim();
  }
  return names;
}
