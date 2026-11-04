import type { BrowserRequest } from './curl';
export function politeClient(
  options: {
    fetch?: (input: string, init?: RequestInit) => Promise<Response>;
    sleep?: (ms: number) => Promise<void>;
    random?: () => number;
    now?: () => number;
  } = {},
) {
  const request = options.fetch ?? fetch,
    sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
    random = options.random ?? Math.random,
    now = options.now ?? Date.now;
  let queue = Promise.resolve(),
    last: number | null = null;
  return function send(input: BrowserRequest): Promise<Response> {
    const task = queue.then(async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        if (last !== null)
          await sleep(Math.max(0, last + 750 + random() * 250 - now()));
        let response: Response;
        try {
          response = await request(input.url, {
            method: input.method,
            headers: input.headers,
            body: input.body,
            redirect: 'error',
          });
        } catch {
          throw Error(
            'The website request failed. Check your connection and copy a fresh cURL.',
          );
        } finally {
          last = now();
        }
        if (response.status === 401 || response.status === 403)
          throw Error(
            'Your session has expired. Copy a fresh cURL and run it again.',
          );
        if (response.status === 429 || response.status === 503) {
          if (attempt === 4)
            throw Error(
              `The website is busy (${response.status}). Try again later.`,
            );
          const retry = response.headers.get('retry-after');
          const delay = retry
            ? /^\d+$/.test(retry)
              ? Number(retry) * 1000
              : Math.max(0, Date.parse(retry) - now())
            : 30000 * Math.pow(2, attempt);
          await response.body?.cancel();
          await sleep(
            Number.isFinite(delay) ? delay : 30000 * Math.pow(2, attempt),
          );
          continue;
        }
        if (!response.ok) {
          await response.body?.cancel();
          throw Error(
            `The website returned status ${response.status}. Copy a fresh cURL and run it again.`,
          );
        }
        return response;
      }
      throw Error('The website did not respond.');
    });
    queue = task.then(
      () => {},
      () => {},
    );
    return task;
  };
}
