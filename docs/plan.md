# Build plan

The order to build Munch in, and how. `AGENTS.md` and `DESIGN.md` hold the rules; this file is the sequence. Tick items off here as they land, and keep each step to one or a few small commits.

The first goal is speed to something visible: Sri should have a running dev server within minutes, then watch the story fill in chapter by chapter with the demo person while the dev server keeps running.

## Step 0: install and run (do this first, fast)

1. One package at the root (no monorepo), `"type": "module"`, `"name": "munch"`, `"private": true`. Scripts:
   - `dev`: `vite` (config at the root, `root: "web"`)
   - `build`: `vite build`, `preview`: `vite preview`
   - `typecheck`: `tsc --noEmit -p .`
   - `test`: `bun test`
   - `munch`: `bun cli/main.ts`
   - `tokens`: `bun scripts/build-tokens.ts`
2. Install:
   ```bash
   bun add react react-dom @tanstack/react-router @tanstack/react-table zod \
     d3-scale d3-shape d3-array d3-time d3-delaunay \
     @fontsource-variable/bricolage-grotesque @fontsource-variable/source-serif-4 \
     lucide-react clsx tailwind-merge class-variance-authority sonner idb-keyval
   bun add -d vite @vitejs/plugin-react @tailwindcss/vite tailwindcss typescript \
     @types/react @types/react-dom @types/bun @types/d3-scale @types/d3-shape \
     @types/d3-array @types/d3-time @types/d3-delaunay
   ```
3. `vite.config.ts`: React and Tailwind plugins, `root: "web"`, `publicDir: "public"` (inside web), aliases `@` to `web/src` and `@core` to `core`, and a small plugin that serves `data/orders.json` at `/local/orders.json` in dev only (404 when the file does not exist). `server.fs.allow` the repo root.
4. `tsconfig.json`: strict, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `types: ["bun", "vite/client"]`, the same path aliases, and include `cli`, `core`, `demo`, `scripts`, `web/src`.
5. shadcn: `bunx shadcn@latest init` with `components.json` pointing at `web/src` (css `web/src/styles/app.css`, components `@/components`, ui `@/components/ui`, utils `@/lib/utils`, lucide icons, CSS variables on). Then add: `button select dropdown-menu sheet table toggle-group badge skeleton sonner popover command tooltip separator scroll-area input`. Read `.claude/skills/shadcn/SKILL.md` before this.
6. A minimal `web/index.html` and `web/src/main.tsx` that renders the top bar and an empty start page in the right fonts and colours, then **start the dev server in the background right away** and tell Sri the URL (http://localhost:5173). Keep it running for the rest of the session; everything after this arrives by hot reload.
7. Commit: "Scaffold Vite, React, Tailwind and shadcn".

## Step 1: tokens and theme

- `scripts/build-tokens.ts` reads `design/tokens.json` and writes `web/src/styles/tokens.css`: light values on `:root`, dark values under `[data-theme="dark"]`, and the same dark values under `@media (prefers-color-scheme: dark)` for `[data-theme="auto"]`. Variables are `--m-bg`, `--m-ink`, `--m-data-1` to `--m-data-6`, `--m-seq-1` to `--m-seq-5`, `--m-muted` and so on.
- `web/src/styles/app.css`: imports Tailwind and tokens.css, maps the tokens to shadcn's variable names exactly as DESIGN.md lists, sets fonts (`--font-display`, `--font-text`), the type utilities (`text-display`, `text-title`, `text-heading`, `text-lede`, `text-body`, `text-ui`, `text-small`, `text-tick`, `text-stat`), radii, `shadow-lift`, the focus ring, and removes Tailwind's default palette so only tokens can be used.
- An inline script in `index.html` sets `data-theme` from localStorage (`auto` by default) before paint, so there is no flash.
- Commit.

## Step 2: the schema and the demo person

- `core/schema.ts`: the zod schema and types from AGENTS.md (`Order`, `OrderItem`, `Money`, `Home`, `OrdersFile` with `{ version: 1, source, generatedAt, orders }`).
- `demo/generate.ts`: a seeded generator (mulberry32 or similar; fixed seed) for a made-up person, written to `web/public/demo/orders.json` (commit it; it is fake). `bun run munch demo` regenerates it. Make the habits real enough that every chapter has a finding:
  - About 1,300 orders from March 2017 to October 2026, across three homes: Utrecht (2017 to mid 2019), Amsterdam Oost (mid 2019 to early 2023), Rotterdam (2023 onwards). Use made-up postcode areas.
  - About 45 made-up restaurants (never real chains or real restaurant names), each tied to one home's delivery area, with cuisines (pizza, sushi, Indian, Thai, burgers, Surinamese, Turkish, poke, Chinese, Italian, Middle Eastern, breakfast) and a small menu of dishes with prices that rise about 4% a year.
  - Rhythm: peaks on Friday and Saturday 18:30 to 21:00, a Sunday lunch habit in the Amsterdam years, a thin late-night tail after 23:00, almost nothing before 11:00. A bump in the days after the 25th (payday). Summer holiday gaps of one to three weeks each year. A clear rise from March 2020 to mid 2021 (lockdowns).
  - Each home has two or three regulars that take a large share, and the regulars change with each move. One restaurant is a long-time favourite that survives a move (it delivers to both areas).
  - About 15% group orders, mostly Friday and Saturday evenings, with group sizes of 2 to 6 and baskets about 2.5 times bigger. About 8% pickup. About 1% cancelled.
  - Fees: delivery fees between €0 and €3.50, a service fee from 2022, occasional small-order fees, tips on about a third of orders, discounts now and then.
  - Payment methods: iDEAL most of the time, some card, some PayPal.
- Commit.

## Step 3: the analysis core

Pure functions in `core/analyze/`, each with a behaviour test (`bun test`) on the demo file or on a few hand-written orders. Every function takes `orders` (already filtered) and returns plain data, including the numbers its chapter's lede needs.

| Module | Returns |
| --- | --- |
| `filter.ts` | `applyFilter(orders, { year?, home? })`, `availableYears`, `availableHomes`. Cancelled orders are excluded from everything except counts that say so |
| `summary.ts` | count, first and last order, total spend, restaurants, dishes, average order, orders per week |
| `rhythm.ts` | 7 × 24 matrix (Monday first, Europe/Amsterdam), peak cell, share of orders in the peak 3 hours, the latest-night order |
| `timeline.ts` | per month: orders and spend; home spans; the busiest month |
| `regulars.ts` | restaurants ranked by orders: count, spend, first, last, every visit date, typical slot ("Friday around 20:00": the mode of weekday and the median hour), your usual dish, share of all orders held by the top three |
| `dishes.ts` | dishes ranked by count, grouped by name per restaurant; cuisines per year as shares, top five by rank over the whole history (stable colours), the rest as Other |
| `novelty.ts` | per year: share of orders at a restaurant never ordered from before |
| `company.ts` | solo vs group counts and shares, average basket each, group orders by weekday and hour, average group size |
| `calendar.ts` | every day with its count; longest streak of consecutive days; longest gap; busiest week |
| `homes.ts` | per home: dates, orders a week, top restaurant, top cuisine, typical slot, average order |
| `cost.ts` | totals of food, delivery fees, service fees, small-order fees, tips, discounts; average order value per year; the payday effect (orders a day in the five days after the 25th vs the rest) |
| `core/predict.ts` | the next order: score each hour of the next 7 days from the recent weekday-hour rate (exponentially weighted, half-life 120 days) times a gap factor from days since the last order; the most likely window; restaurants scored by recency-weighted frequency in that weekday and part of day, with smoothing; and a backtest that replays the last 100 orders using only earlier history and reports top-1 and top-3 restaurant hit rates and how often the predicted day was right. `now` is a parameter |

Commit per two or three modules.

## Step 4: data loading and the app shell

- `web/src/data/`: a provider that loads, in order: a file the person opened earlier (kept in IndexedDB with idb-keyval), `/local/orders.json` (dev only), or nothing, which sends them to `/start`. "See the demo" loads `/demo/orders.json`. Every file is validated with the zod schema; a bad file shows the error from DESIGN.md.
- TanStack Router, code-based routes: `/` story, `/orders`, `/places`, `/start`. The filter lives in search params (`?year=2023`, `?home=2`) and is shared by all routes. Analysis runs in `useMemo` keyed by the filter; there is no loading state for it.
- Top bar as in DESIGN.md: the wordmark with the plate mark, text links for Story, Orders and Places (active one underlined in amber, 2px), and on the right the filter (shadcn Select: All time, each year, each home), the data badge (DropdownMenu: Demo or "Your orders, updated 3 Nov", with "See the demo", "Open my orders.json" and "Forget my file"), and the theme ToggleGroup (Auto, Light, Dark, icons with aria-labels).
- `web/src/lib/format.ts`: euros from cents ("€23.50", "€1,240"), dates ("Fri 23 Oct", "23 October 2026"), 24-hour times, plurals.
- Commit.

## Step 5: the story, one chapter at a time

Build the chart primitives first in `web/src/charts/`: `useSize` (ResizeObserver), `Axis`, `Grid`, `ChartTooltip` (follows the pointer, surface and shadow-lift, positioned to stay on screen), `Figure` (the finding sentence above, the chart, a caption, and the "Show the numbers" toggle that swaps in a shadcn Table of the same data), and keyboard focus across marks (roving tabindex, arrow keys, Enter opens the explorer filtered). Then the chapters in this order, each a commit, each looked at in the browser in both themes at 375px and 1440px before moving on:

1. **The plate (hero).** SVG with a 1000 × 1000 viewBox. A plate: an outer rim circle in `surface` with a `line-strong` hairline, an inner well circle in `line`. Each order is a dot: angle from the time of day (midnight at the top, clockwise; `angle = minutes / 1440 × 2π − π/2`), radius from the date between an inner radius of about 90 and an outer radius of about 450 (start linear in time; DESIGN.md leaves the mapping open). Dots r 3.5 in `data-1` (solo) and `data-2` (group), 85% opacity. Hour labels 00, 06, 12, 18 outside the rim in `text-tick`; a hairline ring at the start of each year, labelled with the year where the ring meets about 02:00. Hover with d3-delaunay for the nearest dot; the tooltip names the day, time, restaurant and total. The first visit fills the dots in chronological order over 2.4s (staggered opacity and scale, sessionStorage flag); reduced motion shows them at once. Beside it (below on phones): the display line "1,284 orders since March 2017." and a lede sentence built from the analysis ("Mostly Friday evenings, mostly sushi, and more than a third of it from three places.").
2. **Your week.** The 7 × 24 heatmap: cells with 2px gaps and 3px corners, zero in `raised`, five steps of the amber ramp by quantile, the peak cell outlined 2px in `ink`, weekday labels on the left, hour ticks every 3 hours, a ramp legend with "fewer" and "more" at its ends.
3. **The years.** Monthly order columns (`data-1`), with each home as a labelled band under the axis; spend per month as a second, shorter chart on the same x axis directly below. Label the busiest month and the lockdown rise in the lede, not on every bar.
4. **Your regulars.** Top ten as ranked horizontal bars with the count at the end. Under each name, a thin lifetime strip across the full history with a tick per order, and "Usually Friday around 20:00, mostly the salmon poke bowl." Clicking a name opens it in Places.
5. **What you eat.** Top dishes as a ranked list with counts (not a chart); cuisines per year as 100% stacked columns with 2px gaps, five named cuisines plus Other, a legend, direct labels on the latest year.
6. **Company.** A tall segmented bar for on your own vs group, two stat tiles for the average basket of each, and the week grid again with group orders as dots in `data-2`.
7. **Streaks and gaps.** The calendar: one square per day (about 9px, 2px gap), weeks as columns, one row block per year, amber when you ordered (ramp by count), the longest streak and longest gap outlined in `ink` and labelled.
8. **Homes.** One panel per home on the `raised` ground (not cards with shadows), side by side on desktop: the dates, orders a week as a stat, top restaurant, top cuisine, typical slot, average order. "Home 1" until renamed; a small rename action stores the name in localStorage.
9. **New or familiar.** One line of the share of orders at new restaurants per year, the latest point labelled.
10. **The cost.** A row of stat tiles (food, delivery fees, service fees, tips, discounts), average order per year as a line, and the payday sentence.
11. **Next order.** A sentence: "Next likely: Friday between 19:00 and 21:00, probably Sakura Sushi." Three runner-ups as a small ranked list with their scores, and the backtest in words: "On your last 100 orders this guessed the restaurant right 31 times, and in its top three 58 times."
12. A closing line linking to Orders: "Every order is in the explorer."

## Step 6: the explorer

- `/orders`: TanStack Table with shadcn Table: date, restaurant, dishes (truncated), total (right-aligned, tabular), delivery or pickup, group. Search ("/" focuses it), sort, and filter chips for delivery or pickup and group. Virtualise only if it gets slow. A row opens a Sheet (`?order=`) with the items, the fees and "Your 12th order from this restaurant".
- `/places`: restaurants ranked with search; a Sheet (`?place=`) with the lifetime strip, your usual, typical slot and every order.
- Commit.

## Step 7: the CLI

- `cli/curl.ts`: parse "Copy as cURL (bash)" from Chrome, Firefox and Safari: single quotes, `$'…'` strings, line continuations, `-H`, `-b` and `--cookie`, `-X`, `--data`, `--data-raw`, `--data-binary`, `--compressed` and other flags ignored. It returns the method, URL, headers and body, and a `redactedSummary()` that names the auth it found (for example "bearer token, 14 cookies") without values. Tests with made-up cURL strings only.
- `cli/shape.ts`: any JSON to its shape: objects keep keys, arrays become `{ "$length": n, "$items": <merged shape of all items> }`, strings `"<str>"`, numbers `0`, booleans `false`, null `null`. Strings that look like ISO dates become `"<date>"` so dates can be found without seeing them. If the response is HTML, collect the JSON inside `<script type="application/json">` tags and shape each, and say the page is server-rendered. Tests.
- `cli/http.ts`: the polite client from AGENTS.md (sequential, 750ms plus jitter, Retry-After and backoff on 429 and 503, five tries, a clear stop on 401 and 403). It never logs headers.
- `cli/main.ts`: `probe <name>` (reads `pbpaste`, makes the one request, writes `shapes/<name>.json` and prints the status, content type, size and the auth summary), `demo`, `check` (counts and problems in `data/orders.json`: orders, date range, missing fields, never values), and `build` and `fetch` stubs that say the Thuisbezorgd adapter waits for the probe.
- Commit, then tell Sri exactly what to copy (below) and wait for the shape files before writing the adapter.

### What Sri copies

1. Sign in on thuisbezorgd.nl in Chrome, open the account menu and go to the orders page (your order history).
2. Open DevTools (⌥⌘I), go to Network, choose the Fetch/XHR filter, and reload the page.
3. Click through the requests until one's Response tab shows your list of orders. Right-click it, then Copy, then Copy as cURL (bash).
4. In the terminal: `bun run munch probe orders`.
5. If the page loads more orders when you scroll or press a button, do the same for the request that appears then: `bun run munch probe orders-page-2`.
6. Open one order's detail and do the same: `bun run munch probe order-detail`.
7. If no Fetch/XHR request holds the orders, switch the filter to Doc, copy the page request itself, and run `bun run munch probe orders-page`; the probe will say whether the page is server-rendered.

Never paste the cURL anywhere else.

## Step 8: the Thuisbezorgd adapter (after the probe)

From the shape files only: walk every page of the history from the newest, save each page raw under `data/raw/thuisbezorgd/pages/`, fetch each order's detail once into `data/raw/thuisbezorgd/orders/<id>.json`, stop at the first order already stored (unless `--full`), then `munch build` normalises the raw files into `data/orders.json` and `munch check` reports counts. Validate the fields used with zod; a change on the site fails with a clear message naming the missing field, not the value. Then update the checklist on ideas issue 15.

## Step 9: public polish

README in the style of Long Exposure's (what you get, getting your orders, your data stays yours, run it yourself, how it works), screenshots of the demo person under `docs/screenshots/`, an MIT licence, and a static build of the demo. Do not create a GitHub remote until Sri says so.

## Build checklist

- [x] Step 0: scaffold, dependencies, shadcn components and running dev server
- [x] Step 1: generated tokens, semantic theme mapping and fonts
- [x] Step 2: validated schema and repeatable demo person
- [x] Step 3: pure analysis modules and prediction with behaviour tests
- [x] Step 4: file loading, routes, shared filters and app shell

## Current priority

Sri asked to show his local import and provide `orders.json` before continuing the chapters. A temporary import summary and order lists are in place. The captured detail can be rebuilt and checked. Full-history fetching remains blocked by the website rejecting the copied session. Steps 5, 6, 7 and 8 are not marked complete.
- [x] Step 5.1: the plate, Delaunay hover, keyboard exploration and chronological fill
- [x] Step 5.2: weekly heatmap, quantile ramp, tooltips and number table
- [x] Step 5.3: monthly orders and spend on separate scales
