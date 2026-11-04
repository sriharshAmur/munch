# Munch design

Munch turns your food delivery history into something you can read at a glance and then explore: what you order, from where, when, with whom, how it changed over the years and homes, and what you'll probably order next. This document is the source of truth for look, feel, charts and voice. Read it before building any screen, then `design/tokens.json` for the values. Nothing here is code; it is the decisions the code must follow.

## Who it is for, and what they should feel

- **You, with your own data.** A year of orders (Thuisbezorgd keeps about that much), finally visible. The first screen should feel like being caught: "I didn't know I did that." Then curiosity: you want to click a restaurant, a year, a Friday night.
- **A visitor on GitHub or the public demo.** They see a made-up person's history and should understand in ten seconds what Munch shows and how to get their own.

The feeling is a kitchen late at night: a dark room, one warm lamp, and the plain facts of your habits laid out on the table. Curious, a little funny, never judging. Nobody is told they spend too much.

## Product principles

1. **The answers first, the explorer second.** The home page reads top to bottom: stories, a headline, then one card per question. Every figure leads somewhere you can dig: a click on a restaurant, a year or a cell opens the explorer already filtered.
2. **Every chart says one thing, in words.** Each figure sits under a sentence that states its finding with real numbers ("Most of your orders land between 19:00 and 21:00 on a Friday"). The chart is the evidence, not the point.
3. **Show patterns, not totals.** A total is a tile at most. The interesting parts are rhythm, change, loyalty, streaks and surprises.
4. **A filter never blanks the page.** Changing the year or home re-runs the analysis in place (it is fast and local); the old figure stays until the new one is drawn.
5. **Honest predictions.** A prediction shows how often the same method would have been right on your past orders. If it would have been wrong most of the time, it says so.
6. **Your data stays on your machine.** Nothing is uploaded. The page says this once, plainly, where a person drops their file.
7. **No slop.** Every section has a finding or it goes. No section exists because a dashboard would usually have one.

## Principles of the look

**One warm light.** The accent, amber "lamp", is the only colour for actions and for the one thing a figure highlights. Everything else is ink, paper and quiet data colours.

**Questions with answers, and stories.** The home page opens on a row of story rings (the whole year, then each month) and a headline. Below it, every card asks one plain question ("When do you order?"), answers it in large type, says the finding in a sentence, and shows the evidence. The answer is readable without the chart; the chart is there to trust it and to click into. The kitchen tickets and the stories are the two bold elements; the cards stay quiet.

**Structure is information.** A hairline separates things that are different. Chapters are not numbered, because they are not steps. Panels are things (one restaurant, one home); the explorer uses a table, not a grid of cards.

**Lunch and late.** Light is a pale lilac white, like a plate in daylight. Dark is aubergine at night. Both are first-class; Auto follows the system, and the choice is remembered with no flash on load.

**Motion explains.** Bars grow up from their baseline the first time they are seen, and slide to new heights when a filter changes. Story rings pop in, a story's slides spring up, numbers count once. Everything else answers a person: a sheet, a ticket straightening under the pointer, a chip appearing. No fade-and-slide on every section. Reduced motion draws everything in place and stops the stories advancing on their own.

## Colour

Code never writes a hex value; it uses the semantic names, which are also shadcn's variable names (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). Text contrast is at least 4.5:1 in both themes.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#fbf9fc` | `#1e1422` | The page |
| `bg-deep` | `#f3eef5` | `#170f1a` | Top bar, footer, the explorer's side |
| `surface` | `#ffffff` | `#2a1c2f` | Cards, inputs, sheets, dialogs |
| `raised` | `#efe9f1` | `#33233a` | Chips, hovered rows, empty heatmap cells |
| `line` / `line-strong` | `#e2d9e5` / `#c7b9cc` | `#3f2d45` / `#5a4560` | Hairlines; input borders and axis baselines |
| `ink` | `#24162a` | `#f6ede9` | Headings and body |
| `ink-soft` | `#54465a` | `#d2c3cb` | Story prose, descriptions |
| `ink-faint` | `#6e5f73` | `#a8979f` | Captions, ticks, table meta (5.7:1 and 6.4:1) |
| `accent` | `#f2b13a` | `#f2b13a` | The lamp: primary buttons, chosen filter, the highlighted mark |
| `accent-ink` | `#8a5200` | `#f7c766` | The lamp as text: links, ghost buttons |
| `accent-fg` | `#24162a` | `#1e1422` | Text on an accent fill |
| `accent-soft` | `#fbefd6` | `#3a2a1c` | Active filter wash, selected row |
| `problem` | `#a8362a` | `#ef8577` | Errors, with a word |

shadcn mapping: `--background` bg, `--foreground` ink, `--card` and `--popover` surface, `--muted` raised, `--muted-foreground` ink-faint, `--primary` accent, `--primary-foreground` accent-fg, `--accent` accent-soft (shadcn's hover wash), `--border` line, `--input` line-strong, `--ring` focus, `--destructive` problem, `--chart-1` to `--chart-6` the categorical slots.

### What Munch does not do with colour

No decorative gradients and no glow. No amber on anything that is neither pressable nor the one highlighted mark. No brand colours of any delivery company. No red for spending: money is a fact here, not a warning.

The stories are their own room: five fixed grounds in `design/tokens.json` (`stage`), the same in both themes, each passing 6:1 or better for text and highlight.

## Charts

Charts are small hand-built components (`web/src/charts/Bars.tsx` and the cards in `web/src/home/`), plain HTML and SVG, with d3 for maths only (never d3 for the DOM). No chart library. Every chart follows the dataviz method; the rules that matter most:

- **Colour by job.** Identity uses the categorical slots in fixed order: slot 1 is solo orders and any single series, slot 2 is group orders, homes take slots in the order you lived in them. Restaurants wear a monogram on a tint of a slot picked from their id. Magnitude uses the one-hue amber ramp, with zero drawn as `raised`. Highlighting one thing means that thing in amber and the rest in `muted`.
- **One axis.** Never two y-scales.
- **Thin marks.** Bars at most 18px wide (weekly bars fill their column), 4px rounded tops on one baseline, gaps between neighbours.
- **Recessive frame.** A baseline in `line-strong`, ticks in `ink-faint` at 13px, no gridlines on small cards. No chart borders.
- **Labels.** Text wears ink tokens, never a series colour. Label the peak directly. A legend whenever there are two or more series; long names are cut with an ellipsis and keep the full name on hover.
- **Hover and focus.** Every mark has a tooltip on hover and on keyboard focus, with a hit target the full height of its column. Clicking a mark opens the orders filtered to it (an hour, a weekday, a week, a price range, a day).
- **A table behind every chart.** Each card has "Show the numbers", which swaps the figure for its table.
- **Empty and thin data.** Fewer than five orders in a view, and the page says so in a sentence instead of drawing noise. A card with nothing to say is left out.
- **Built for a year.** Weeks, not months, in the timeline; one calendar; months as stories. Check every chart with a small, scattered history (about 50 orders, 30 restaurants, six homes with long names) as well as the demo.

### The home page

| Part | Form | What it says |
| --- | --- | --- |
| Story rings | Your year, then each month with three or more orders, newest first; lit until watched | Opens a full-screen story of about eight slides: count, number one, dish, peak hunger, new places (or one-try places for the year), order type |
| Headline | "87 orders since November 2025." and a sentence, then four facts | Spent, restaurants, busiest month, last order |
| When do you order? | 24 hour bars from 05:00, peak three hours in amber; or 7 weekday bars | The peak window and its share |
| Where from? | Top six, ranked, monogram, usual dish, count bar | Your number one and how much the top three take |
| How did the year go? | One bar per week, stacked by home, the busiest labelled | Busiest month and week, the longest quiet stretch |
| What do you order most? | Top five dishes, ranked | Your dish |
| What does an order cost? | €5 histogram, the median's bin in amber; where the money went | Your usual order and the share that went on fees |
| On your own, or for a group? | A split bar and two tiles | How often, and the difference in basket |
| Which days did you order? | A week-by-day calendar, darker for more, the longest run outlined | Longest run, longest break |
| Where were you living? | Each home with its span, count and usual place (only with two or more homes) | Homes keep one colour everywhere |

After the cards:

| Section | Form | Notes |
| --- | --- | --- |
| Things we noticed | Kitchen tickets hanging from a rail, scrolled sideways; each with a value, a sentence and a small piece of evidence | A ticket appears only when the history supports it (`core/analyze/noticed.ts`) |
| Your order type | One large sentence ("You're a night owl.") and six habit bars: the bar is the share, the mark is where the habit counts as strong | Compares you only with yourself (decision 0007) |
| Your next order | The guess in one sentence and ten dots for its hit rate on your past orders | "Right about 2 in 10": honest, never a probability it can't back up |

## Typography

**Bricolage Grotesque** (variable, self-hosted through Fontsource) for headlines, numbers, the wordmark, buttons, labels and chart text. Its slightly irregular, market-sign shapes feel handmade without being cute, and its width and optical-size axes let the display numbers go big and tight. Big numbers use tight tracking (-0.03em) and tabular figures where they line up.

**Source Serif 4** (variable, self-hosted) for story prose and captions. It reads well at length and gives the story the voice of an essay, not a dashboard.

| Utility | Face | Size | Use |
| --- | --- | --- | --- |
| `text-display` | display 700 | clamp 44 to 84px | One per page: the headline |
| `text-title` | display 600 | clamp 30 to 42px | Chapter titles |
| `text-heading` | display 600 | 22px | Panel and sheet titles |
| `text-lede` | serif | 22px | The sentence under a chapter title that states the finding |
| `text-body` | serif | 18px, line height 1.6 | Story prose, at most 68 characters a line |
| `text-ui` | display | 15px | Buttons, inputs, menus, table cells |
| `text-small` | display | 14px | Captions under figures, table meta |
| `text-tick` | display | 13px, tabular | Axis ticks only; the smallest size anywhere |
| `text-stat` | display 600 | clamp 32 to 44px, tabular | The number in a stat tile |

The wordmark is "munch" in lowercase Bricolage Grotesque at 700, with an amber plate with one bite out of it before it.

## Spacing, radius, elevation

- A 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128. Chapters are separated by 128px on desktop and 96px on phones.
- Radius: `sm` 6px (chips, cells), `md` 10px (inputs, menu items), `lg` 16px (sheets, dialogs), 20px for cards, `full` (buttons, pills, segmented controls, story rings).
- One shadow, `shadow-lift`, for things that float: menus, sheets, dialogs, tooltips. Cards have no shadow; a hairline does the work.
- Controls are 40px tall, with at least a 44px pressable area.

## Layout and navigation

```
┌───────────────────────────────────────────────────────────────┐
│ ◖ munch      You  Orders  Places      [All time ▾] [Demo ▾]  ◑ │  top bar, sticky
├───────────────────────────────────────────────────────────────┤
│  (◉)(Oct)(Sep)(Aug)(Jul)(Jun) …                     story rings│
│                                                               │
│  87 orders since November 2025.                     headline  │
│  About one every 4.1 days. Most often on a Saturday…          │
│  Spent │ Restaurants │ Busiest month │ Last order             │
│                                                               │
│  ┌ When do you order? ──────────┐ ┌ Where from? ──┐           │
│  │ 18:00 to 21:00   ▁▁▂▁▁▆█▆▁▂  │ │ ① Little …   │  cards    │
│  └──────────────────────────────┘ └───────────────┘           │
│  ┌ How did the year go? ─────────────────────────────┐        │
│  └───────────────────────────────────────────────────┘        │
│  Things we noticed · Your order type · Your next order        │
└───────────────────────────────────────────────────────────────┘
```

- **You (`/`)**: story rings, the headline, the cards, then the tickets, the order type and the guess. The page is 76rem wide with the gutter from the tokens; cards sit on a 12-column grid and stack on a phone.
- **Orders (`/orders`)**: every order, newest first, broken by month with each month's count and spend. Search needs every word and marks the matches across the restaurant, dishes and the date. Each filter in use is a chip you can remove. A row shows the date and time, the restaurant's monogram, the dishes and tags (first time, group, pickup, cancelled). A row opens the order in a sheet (`?order=`) with its items, receipt, where it sits in your history and every other order from that place; previous and next step through the list.
- **Places (`/places`)**: every restaurant, ranked, with a status (regular, gone quiet, old home, tried once, new, now and then), its usual dish, a twelve-month sparkline, orders, last order and spend. Search covers dishes too; sort by orders, latest, spend or name. A restaurant opens in a sheet (`?place=`) with four facts, months, weekdays, every dish with its price change, and every order.
- **The filter** in the top bar (All time, a year, or a home) applies to all three pages and lives in the URL (`?year=2023`, `?home=2`), so any view can be shared with yourself and the back button works.
- **The data badge** says where the data came from: "Demo" or "Your orders". Pressing it opens a small menu that says when the file was made, and lets you switch or load a file.
- **Start (`/start`)**: shown when no data is loaded. Three of the demo person's tickets fanned out, one sentence about Munch, two actions: "See the demo" and "Open my orders.json", a short "How do I get my orders?" pointing at the CLI, and the privacy line.

## Components

The components are shadcn/ui's (Radix underneath), added with the shadcn CLI into `web/src/components/ui` and restyled with the tokens. Never hand-copy a component, never add a second component library. Check the shadcn docs for a component before using it. Where shadcn's defaults and this document disagree, this document wins.

- **Button**: a pill. Variants: `primary` (amber fill, accent-fg text), `secondary` (surface with a strong hairline), `ghost` (accent-ink text), `link`. A button says what happens.
- **Select, DropdownMenu, Popover, Command**: the top-bar filter is a Select; the data badge is a DropdownMenu; a long searchable list (restaurants) is a Combobox (Popover with Command).
- **ToggleGroup**: segmented choices such as Orders | Spend, and Auto | Light | Dark.
- **Table**: the explorer, with TanStack Table for sort, filter and search. Hairline rows, tabular numbers right-aligned, a sticky header. "/" focuses the search.
- **Sheet**: an order or a place, from the right on desktop and from the bottom on phones. Escape closes it and focus returns to the row.
- **Tooltip / HoverCard**: chart tooltips use a shared `ChartTooltip` built on the same surface and shadow, not Radix tooltips, so they follow the pointer.
- **Badge**: delivery or pickup, group, cancelled. Always a word.
- **Skeleton**: only while a file is being read. Analysis is synchronous and fast, so figures never show a spinner. The next-order backtest runs a moment after the page settles and says so while it does.
- **Dialog**: the stories, full screen on a phone and a tall card on a wide screen.
- **Sonner**: one short toast at a time ("Loaded 1,284 orders").

## Voice

Written content is part of the design. Write like a friend who looked at your data and found it interesting.

- Address the reader as "you". Sentence case everywhere, including buttons and headings.
- Every chapter title is plain and short; the lede under it is the finding, with numbers: "The usual" then "You've ordered from Sakura Sushi 86 times, more than your next three places together."
- A little dry humour is allowed in a lede, never at the reader's expense. No guilt about money or health.
- A button says what happens: "See the demo", "Open my orders.json", "Show the numbers". Never "Submit" or "OK".
- An empty state is an invitation: "No orders in 2019. Pick another year."
- An error says what happened and what to do: "This file isn't a Munch orders file. Run munch build and open data/orders.json."
- Money: "€23.50", with thousands as "€1,240". Times on the 24-hour clock: 19:30. Dates: "Fri 23 Oct" in lists, "23 October 2026" in prose.
- No exclamation marks, no emoji, no "journey", "insights", "unlock", "foodie" or "delve".

### Words we use

| Use | Instead of | Note |
| --- | --- | --- |
| order | purchase, transaction | |
| restaurant | merchant, partner, vendor | Also for shops on the platform; one word everywhere |
| dish | item, product, SKU | "Items" only in the order sheet's line list |
| group order | shared order, party order | The opposite is "on your own" |
| delivery, pickup | fulfilment method | |
| home | address, location | A doorstep. Private local labels may show the street and number at Sri's request; the order export keeps only the coarse area. |
| spend | revenue, cost | What you paid, fees included |
| your usual | favourite, top item | The dish you order most at a restaurant |

## Accessibility

- Text contrast at least 4.5:1 in both themes; a token change is rechecked.
- Every pressable thing is at least 44px in one direction.
- A visible 2px focus ring, offset 2px, in `focus`.
- Colour that carries meaning sits next to a word or a legend; every chart has a table view.
- Sheets, dialogs and menus trap focus, close on Escape and return focus (Radix through shadcn).
- Charts are reachable by keyboard: Tab enters the figure, arrow keys move between marks, Enter opens the explorer.
- `prefers-reduced-motion` draws bars in place, removes travel, and stops the stories advancing on their own.
- Every card, ticket and slide states its finding in text; a chart is never the only place a number lives.

## Checks before a screen is accepted

1. Look at it in Light and Dark, at 375px and 1440px, with the demo data.
2. Every chart has a sentence above it that states its finding, a table view, and tooltips by mouse and keyboard.
3. No hex values in components; only tokens.
4. Nothing animates on its own except bars growing in once and the stories advancing; reduced motion is respected.
5. Tab through it: every control shows its focus ring.
6. Read every button aloud: it says what will happen.
7. Screenshots use the demo person only.

## Open items

- Check that Bricolage Grotesque's tabular figures are good enough for table columns. If not, tables use Source Serif 4's tabular figures.
