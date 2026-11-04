# Munch

Every dinner your delivery history remembers, in one picture.

Munch turns your food delivery history into a story. See when you order, the restaurants you keep coming back to, how your usual changes with each home, and what you might order next.

![Munch's plate, using a made-up person's orders](docs/screenshots/story-1440-dark.png)

## What you get

- A plate of every order. Time of day runs around the rim; dates run from the centre to the edge. Hover a dot or use the arrow keys to open an order.
- Your week as a heatmap, monthly ordering and spend, restaurant lifetimes, dishes and cuisine mix.
- Solo and group orders, streaks and gaps, homes, first visits and the parts of an order's cost.
- A next-order guess with a backtest that says how often it got the restaurant and day right.
- A searchable, sortable order explorer. Open a row for its items and fees, or a place for every visit.

Figures have hover details, keyboard access, links into the explorer and a "Show the numbers" table. Both light and dark themes use the same fixed palettes. The plate fills once on a first visit; reduced motion shows it complete.

## Run it yourself

Install [Bun](https://bun.sh), then:

```sh
bun install
bun run dev
```

Open **http://localhost:5173**. If `data/orders.json` exists, the local app loads it. Otherwise choose **See the demo**, or open a Munch orders file. The demo contains a fixed-seed, made-up person's orders across three homes. Every restaurant and order in it is fictional.

## Get your orders

Use your own signed-in customer browser session. In DevTools, find the request that loads your order history and copy it as **cURL (bash)**. Keep it on the clipboard, then run:

```sh
bun run munch probe orders
bun run munch fetch
bun run munch build
bun run munch check
```

The probe writes a redacted shape for parser development. Fetching follows the website's next-page links, one request at a time, and saves responses locally. Repeated fetches stop at an order already stored. `bun run munch fetch --full` refreshes the complete history. Building runs locally and never needs your session again.

A rejected session stops the run. Copy a fresh request before trying again. If the website changes, the importer stops with field names and keeps the previous built file. The account data download is the fallback if the customer website becomes unreliable.

## Your data stays yours

Nothing is uploaded by the app. Fonts are self-hosted. Private responses, exports, copied requests and normalised orders are ignored by git. The dev server listens on this machine's loopback address.

The normalised file keeps the information needed for the story. It drops names, email addresses, phone numbers and street addresses. Homes use only a coarse postcode area and city. An opened file is kept in this browser's IndexedDB; use **Forget my file** in the data menu to remove it.

The CLI keeps session headers in memory and never prints them. Do not paste a copied cURL into a chat, an issue or a commit.

## How it works

One TypeScript core holds the schema, analysis and predictions. The CLI fetches raw responses before normalising them into a versioned JSON file. The React app validates that file at the boundary and runs the analysis locally.

Charts are SVG, with d3 for the maths. Controls use shadcn and Radix. Design values come from `design/tokens.json`; generated CSS is checked in. The public static build includes only the fictional demo.

```sh
bun test
bun run typecheck
bun run tokens
bun run munch demo
bun run build
```

See [DESIGN.md](DESIGN.md), the [build plan](docs/plan.md) and [decisions](docs/decisions/) for the project's choices. Publication of the customer-site adapter remains subject to the review described in [AGENTS.md](AGENTS.md).

## Screenshots

All screenshots use the fictional demo.

| | Light | Dark |
| --- | --- | --- |
| Desktop | [1440px](docs/screenshots/story-1440-light.png) | [1440px](docs/screenshots/story-1440-dark.png) |
| Phone | [375px](docs/screenshots/story-375-light.png) | [375px](docs/screenshots/story-375-dark.png) |

## Licence

[MIT](LICENSE).
