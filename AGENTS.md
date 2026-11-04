# Munch

Munch explores your food delivery history. A command-line tool fetches your full order history from Thuisbezorgd using your own signed-in browser session, normalises it into one JSON file, and a local web app turns that file into a story: what you order, from where, when, with whom, how it changed across years and homes, and what you'll probably order next. The public repository ships with a made-up person's orders so anyone can see it working without an account.

Read these before you change anything:

1. `DESIGN.md` and `design/tokens.json`: the look, the charts and the voice. Read them before building any screen or chart.
2. `docs/decisions/`: short notes on choices made without asking. Add one when you make a judgement call this file does not cover (`docs/decisions/0001-json-not-sqlite.md` and so on).
3. `.claude/skills/README.md`: the agent skills in this repository and why each one is here.

Anything that is not in this file or the repository does not exist. Ask Sri instead of assuming.

## Privacy and conduct

These rules are absolute. If a task seems to need breaking one, stop and ask.

- **Sri's own account and data only.** The fetcher reads the signed-in person's own order history and nothing else.
- **The session never touches disk.** The CLI reads the copied cURL from the clipboard (`pbpaste`), keeps the bearer token and cookies in memory for the run, and forgets them. They are never written to a file, a log, an error message, a test fixture or a commit. Errors print the URL path and status, never headers. When the session has expired (401 or 403), the CLI stops and says: copy a fresh cURL and run it again.
- **Be polite to the site.** One request at a time, at least 750ms apart, with jitter. On 429 or 503, wait (honour `Retry-After`, otherwise back off exponentially from 30 seconds) and give up after five tries. No parallel requests, ever.
- **Use only what the public website does.** Sri works at Just Eat Takeaway, which owns Thuisbezorgd. The fetcher may call only what the customer website itself calls in the browser, as seen in DevTools. No internal knowledge, code, documentation or endpoints. Agents do not search for or use anything beyond what Sri's own browser shows.
- **Never describe the Thuisbezorgd API in anything published.** No endpoint paths, parameters or response structures in the README, DESIGN.md, docs, commit messages, issues or screenshots. The adapter code is the only place they live, and whether it ships in the public repository is an open item for Sri (see below).
- **Agents never read real order data.** Nothing under `data/` goes into an agent's context: not raw responses, not `orders.json`. To design a parser, an agent reads the redacted shape files in `shapes/` that `munch probe` writes (keys, types and array lengths, every value replaced). To check a parser against real data, an agent runs `munch check`, which prints only counts and problems, never values.
- **Nothing private in the repository.** `data/`, `shapes/`, `.env` and any export are ignored by git from the first commit. Tests, fixtures, screenshots and examples use the demo person only. Before each commit, check `git status` and the diff for anything that looks like a real name, address, restaurant, order or token.
- **The GDPR data download is the fallback.** If the website's own calls turn out to be fragile, say so, and build an importer for the account data export instead.

## Stack

| Part | Choice |
| --- | --- |
| Runtime and package manager | Bun (`bun install`, `bun test`, `bun run`) |
| Language | TypeScript, strict, everywhere |
| CLI | Bun, no framework; `munch <command>` through `bun cli/main.ts` |
| Shared core | Plain TypeScript in `core/`: the order schema (zod), the analysis and the predictions. No Bun, Node or DOM APIs, so it runs in the CLI, the tests and the browser |
| Web | Vite, React 19, TanStack Router (search params for filters), TanStack Table |
| Design system | shadcn/ui (Radix), Tailwind CSS 4, lucide icons, styled with `design/tokens.json` |
| Charts | Hand-built SVG components with d3-scale, d3-shape, d3-array and d3-time for maths only |
| Fonts | Bricolage Grotesque and Source Serif 4 through Fontsource, self-hosted |
| Tests | `bun test` for the core and the CLI's parsing |
| Storage | `data/raw/thuisbezorgd/` holds raw responses as fetched; `data/orders.json` is the normalised output (decision 0001) |

## Layout

```
cli/                 the munch command
  main.ts            argument parsing and the commands: probe, fetch, build, check, demo
  curl.ts            parses a copied cURL into method, URL, headers and body; pulls out the auth in memory
  shape.ts           turns any JSON into its redacted shape
  http.ts            the polite client: sequential, delayed, backs off on 429, stops on 401 and 403
  sources/           one adapter per site (thuisbezorgd/)
core/
  schema.ts          the Order type and its zod schema, the contract between the CLI and the web app
  analyze/           pure functions from Order[] to each chapter's figures
  predict.ts         the next-order prediction and its backtest
demo/
  generate.ts        a seeded, made-up person with several homes and years of orders
web/                 the Vite app
  src/charts/        the hand-built charts
  src/components/ui/ shadcn components (written by the shadcn CLI)
  src/routes/        TanStack Router routes: /, /orders, /places, /start
design/tokens.json   every design value
docs/decisions/      short notes on judgement calls
docs/screenshots/    demo-data screenshots for the README
data/                git-ignored: raw responses and orders.json
shapes/              git-ignored: probe output, redacted
```

## The order schema

`core/schema.ts` is the contract. In short, one normalised order has:

- `id` (the source's order id, prefixed with the source, such as `thuisbezorgd:…`), `source`
- `placedAt` (ISO 8601 with the offset, Europe/Amsterdam) and `deliveredAt` when known
- `restaurant`: `id`, `name`, `cuisines[]`
- `fulfilment`: `delivery` or `pickup`
- `group`: whether it was a group order, and `groupSize` when known
- `items[]`: `name`, `quantity`, `unitPrice`, `total`, `options[]`
- `money` in whole cents: `items`, `deliveryFee`, `serviceFee`, `smallOrderFee`, `tip`, `discount`, `total`, and `currency`
- `payment`: the method name when the site shows it, otherwise null
- `home`: a stable key and a coarse area (postcode digits and city) for grouping by home. Never a street, house number or name
- `status`: `delivered`, `cancelled` or `unknown`

Raw responses keep everything the site returned; the normaliser keeps only what the analysis needs, and never personal details such as names, phone numbers, emails or street addresses.

## Code rules

- The core is pure. Analysis functions take orders and options and return plain data; they never read files, the clock or the network. "Now" is a parameter.
- Parse at the boundary. The CLI validates every response against a zod schema of the fields it uses, and the web app validates `orders.json` when it loads it. Inside, trust the types.
- Money is whole cents. Times are stored as ISO strings with their offset and analysed in Europe/Amsterdam.
- Fetching is incremental. A run walks the history pages newest first and stops when it reaches an order already in `data/raw`; detail is fetched only for orders without a stored detail. `munch fetch --full` refetches everything.
- Raw before normalised. The fetcher only saves raw responses; `munch build` turns them into `orders.json`, so a parser fix never needs a refetch.
- The demo person is generated from a fixed seed, so the demo, the tests and the screenshots are stable. The generator models real habits (weekday rhythm, favourites that change with each home, group orders on weekends, a lockdown spike), so every chapter has something to say.
- Every analysis function has a behaviour test on the demo data or on a small hand-written list of fake orders.
- Charts follow DESIGN.md. Colours come from tokens, never hex values in components.
- Copy follows the voice in DESIGN.md.

## Commands

```bash
bun install
bun run dev            # the web app at http://localhost:5173, using data/orders.json if it exists, else the demo
bun run munch probe    # run the copied cURL once and write its redacted shape to shapes/
bun run munch fetch    # fetch your history into data/raw/ (incremental)
bun run munch build    # normalise data/raw/ into data/orders.json
bun run munch check    # counts and problems in data/orders.json, no values
bun run munch demo     # regenerate the demo person
bun test
bun run typecheck
bun run build          # static site with the demo data, for the public page
```

## Working on the repository

- Commit in small, reviewable steps with plain messages that say what changed and why.
- There is no GitHub remote yet. Do not create one or push until Sri says so.
- Never mention an AI assistant in commits, pull requests or docs.
- When something changes what people see, take screenshots with the demo data at 375px and 1440px in light and dark, and keep the README's screenshots current under `docs/screenshots/`.
- Before saying something works, run it: the CLI against the demo or a probe, the page in a browser.

## Open items

- Whether the Thuisbezorgd adapter ships in the public repository, given Sri's employer. Until Sri decides, keep endpoint details out of everything except `cli/sources/thuisbezorgd/`, and review it before the repository is made public.
- An importer for the GDPR data download, if the website's own calls turn out to be fragile.
