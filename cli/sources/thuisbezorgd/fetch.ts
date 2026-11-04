import { z } from 'zod';
import { mkdir } from 'node:fs/promises';
import { parseCurl } from '../../curl';
import { politeClient } from '../../http';
import { shape } from '../../shape';

const LinkSchema = z.object({
  href: z.string().nullable(),
  templated: z.boolean().optional(),
});
const PageSchema = z.object({
  orders: z.array(z.object({ id: z.string().min(1) }).passthrough()),
  _pagination: z.object({
    total: z.number().nullable(),
    count: z.number(),
    links: z.object({ next: LinkSchema.nullable().optional() }),
  }),
});
export function parsePage(value: unknown) {
  const result = PageSchema.safeParse(value);
  if (!result.success)
    throw Error(
      `History response changed. Check fields: ${[...new Set(result.error.issues.map((i) => i.path.filter((p) => typeof p !== 'number').join('.')))].join(', ')}.`,
    );
  return result.data;
}
export function nextPage(
  page: ReturnType<typeof parsePage>,
  current: string,
  origin: string,
) {
  const link = page._pagination.links.next;
  if (!page.orders.length || !link?.href) return null;
  if (link.templated)
    throw Error('The next-page link needs a new browser probe.');
  let next: URL;
  try {
    next = new URL(link.href, current);
  } catch {
    throw Error('The next-page link is invalid.');
  }
  const first = new URL(origin);
  if (next.origin !== first.origin || next.pathname !== first.pathname)
    throw Error(
      'The next-page link changed the history route. Copy a new history request.',
    );
  return next.href;
}

export async function fetchHistory({
  fromFile,
  full = false,
  resumeProbe = false,
}: { fromFile?: string; full?: boolean; resumeProbe?: boolean } = {}) {
  const copied = fromFile
    ? await Bun.file(fromFile).text()
    : await new Response(
        Bun.spawn(['pbpaste'], { stdout: 'pipe', stderr: 'ignore' }).stdout,
      ).text();
  const request = parseCurl(copied);
  if (request.method !== 'GET')
    throw Error('Copy the history request as cURL (bash).');
  const send = politeClient(),
    seenPages = new Set<string>(),
    seenOrders = new Set<string>();
  await mkdir('data/raw/thuisbezorgd/orders', { recursive: true });
  await mkdir('data/raw/thuisbezorgd/pages', { recursive: true });
  let url: string | null = request.url,
    pages = 0,
    saved = 0,
    expected: number | null = null,
    stoppedAtKnown = false;
  while (url) {
    if (seenPages.has(url))
      throw Error(
        'The website repeated a history page. Fetching stopped before claiming a complete history.',
      );
    seenPages.add(url);
    let input: unknown;
    if (resumeProbe && pages === 0) {
      input = await Bun.file('data/raw/thuisbezorgd/pages/first.json').json();
    } else {
      const response = await send({ ...request, url });
      try {
        input = await response.json();
      } catch {
        throw Error(
          'The history response is not JSON. Copy a fresh history request.',
        );
      }
    }
    await Bun.write(
      'shapes/orders.json',
      JSON.stringify({ kind: 'json', shape: shape(input) }, null, 2),
    );
    const page = parsePage(input);
    expected = page._pagination.total ?? expected;
    const pageKey = new Bun.CryptoHasher('sha256').update(url).digest('hex');
    await Bun.write(
      `data/raw/thuisbezorgd/pages/${pageKey}.json`,
      JSON.stringify(input),
    );
    pages++;
    for (const order of page.orders) {
      if (seenOrders.has(order.id)) continue;
      seenOrders.add(order.id);
      const id = new Bun.CryptoHasher('sha256').update(order.id).digest('hex');
      const path = `data/raw/thuisbezorgd/orders/${id}.json`;
      const file = Bun.file(path);
      if (!full && (await file.exists())) {
        stoppedAtKnown = true;
        break;
      }
      await Bun.write(path, JSON.stringify(order));
      saved++;
    }
    process.stdout.write(`Pages: ${pages}. Orders saved: ${saved}.\n`);
    if (stoppedAtKnown) break;
    url = nextPage(page, url, request.url);
  }
  if (!stoppedAtKnown && expected !== null && seenOrders.size < expected)
    throw Error(
      `The website reported ${expected} orders, but only ${seenOrders.size} were returned. Fetching is incomplete.`,
    );
  process.stdout.write(
    stoppedAtKnown
      ? `Incremental fetch stopped at an existing order. Saved ${saved} new orders.\n`
      : `Reached the end of history. Saved ${saved} orders from ${pages} pages.\n`,
  );
  return { saved, pages, stoppedAtKnown };
}
