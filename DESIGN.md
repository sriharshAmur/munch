# Munch design

Munch turns your food delivery history into a story you can scroll through and then explore: what you order, from where, when, with whom, how it changed over the years and homes, and what you'll probably order next. This document is the source of truth for look, feel, charts and voice. Read it before building any screen, then `design/tokens.json` for the values. Nothing here is code; it is the decisions the code must follow.

## Who it is for, and what they should feel

- **You, with your own data.** Years of orders, finally visible. The first screen should feel like being caught: "I didn't know I did that." Then curiosity: you want to click a restaurant, a year, a Friday night.
- **A visitor on GitHub or the public demo.** They see a made-up person's history and should understand in ten seconds what Munch shows and how to get their own.

The feeling is a kitchen late at night: a dark room, one warm lamp, and the plain facts of your habits laid out on the table. Curious, a little funny, never judging. Nobody is told they spend too much.

## Product principles

1. **The story first, the explorer second.** The home page reads top to bottom like an essay with figures. Every figure leads somewhere you can dig: a click on a restaurant, a year or a cell opens the explorer already filtered.
2. **Every chart says one thing, in words.** Each figure sits under a sentence that states its finding with real numbers ("Most of your orders land between 19:00 and 21:00 on a Friday"). The chart is the evidence, not the point.
3. **Show patterns, not totals.** A total is a tile at most. The interesting parts are rhythm, change, loyalty, streaks and surprises.
4. **A filter never blanks the page.** Changing the year or home re-runs the analysis in place (it is fast and local); the old figure stays until the new one is drawn.
5. **Honest predictions.** A prediction shows how often the same method would have been right on your past orders. If it would have been wrong most of the time, it says so.
6. **Your data stays on your machine.** Nothing is uploaded. The page says this once, plainly, where a person drops their file.
7. **No slop.** Every section has a finding or it goes. No section exists because a dashboard would usually have one.

## Principles of the look

**One warm light.** The accent, amber "lamp", is the only colour for actions and for the one thing a figure highlights. Everything else is ink, paper and quiet data colours.

**The plate is the identity.** The hero is a plate: every order you've ever placed is one dot on it, placed by time of day around the rim (midnight at the top, like a clock) and by date from the centre outwards (first order inside, latest on the edge). Dinner time becomes a bright arc, late nights a thin tail, a move or a lockdown a visible ring. It is the one bold element. It appears on the story's opening, smaller on the explorer's empty state, and as the favicon. Everything around it is quiet.

**Structure is information.** A hairline separates things that are different. Chapters are not numbered, because they are not steps. Panels are things (one restaurant, one home); the explorer uses a table, not a grid of cards.

**Lunch and late.** Light is a pale lilac white, like a plate in daylight. Dark is aubergine at night. Both are first-class; Auto follows the system, and the choice is remembered with no flash on load.

**Motion answers, it never performs.** One orchestrated moment: on the first visit, the plate fills in order by order from the centre outwards, in about 2.4 seconds. Nothing else moves on load or on scroll. A sheet slides in, a filter swaps a figure, a number counts once when its chapter first appears. Reduced motion shows the finished plate at once.

## Colour

Code never writes a hex value; it uses the semantic names, which are also shadcn's variable names (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). Text contrast is at least 4.5:1 in both themes.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#fbf9fc` | `#1e1422` | The page |
| `bg-deep` | `#f3eef5` | `#170f1a` | Top bar, footer, the explorer's side |
| `surface` | `#ffffff` | `#2a1c2f` | Panels, inputs, sheets, dialogs, the plate |
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

No gradients. No glow. No amber on anything that is neither pressable nor the one highlighted mark. No brand colours of any delivery company. No red for spending: money is a fact here, not a warning.

## Charts

Charts are hand-built SVG components in `web/src/charts/`, with d3 for scales, shapes and maths only (never d3 for the DOM). No chart library. Every chart follows the dataviz method; the rules that matter most:

- **Colour by job.** Identity uses the categorical slots in fixed order. Slot 1 is solo orders and any single series, slot 2 is group orders. Cuisines take slots 1 to 5 by their rank over the whole history and keep them when a filter is applied; the rest are "Other" in `data.muted`. Magnitude uses the one-hue amber ramp, with zero drawn as `raised`, never as step 1. Highlighting one thing means that thing in amber and the rest in `data.muted`.
- **One axis.** Never two y-scales. Orders and spend over time are two charts stacked on the same time axis.
- **Thin marks.** Bars at most 18px with 4px rounded data ends anchored to the baseline, 2px surface gaps between adjacent fills, 2px lines, dots at least 6px (8px when hoverable), a 2px surface ring where marks overlap.
- **Recessive frame.** Solid hairline gridlines in `line`, a baseline in `line-strong`, ticks in `ink-faint` at 13px. No dashed rules. No chart borders.
- **Labels.** Text wears ink tokens, never a series colour. Direct-label selectively: the peak, the latest point, the one series that matters. A legend is present whenever there are two or more series.
- **Hover and focus.** Every mark has a tooltip on hover and on keyboard focus, with a hit target larger than the mark. Lines get a crosshair. Clicking a mark opens the explorer filtered to it.
- **A table behind every chart.** Each figure has a "Show the numbers" toggle that swaps it for an accessible table of the same data.
- **Empty and thin data.** A chart with too little data says so in a sentence ("Only 3 orders this year, too few to show a pattern") instead of drawing noise.
- **Check it.** Run the palette validator after any colour change, and look at every chart in both themes at 375px and 1440px for label collisions before calling it done.

### The figures

| Figure | Form | Notes |
| --- | --- | --- |
| The plate | Radial dot plot, 24h around, time outwards | Dots in slot 1 (solo) and slot 2 (group); hovering a dot names the order; rings mark the start of each year |
| Your week | 7 × 24 heatmap, amber ramp | Rows Monday to Sunday, columns 00 to 23; the peak cell outlined in ink; a scale legend |
| The years | Monthly columns of orders, homes as labelled bands under the axis; spend per month as a second chart below on the same time axis | Lockdowns and moves become visible |
| Your regulars | Ranked horizontal bars (orders), each with a thin lifetime strip showing first to last order and every visit as a tick | "Usually Friday around 20:00" under each name |
| What you eat | Ranked dishes as a list with counts; cuisines per year as 100% stacked columns, at most 5 named plus Other | Dishes are grouped by name per restaurant |
| New or familiar | Share of each year's orders at a restaurant you had never ordered from, as one line | The explore-or-stick habit |
| Company | Tall segmented bar for solo vs group; group orders on the week heatmap's grid as dots | Plus basket size side by side as two numbers |
| Streaks and gaps | Calendar: one square per day, a row of weeks per year, amber when you ordered | Longest streak and longest gap outlined and labelled |
| Homes | One panel per home: dates, orders a week, top restaurant and cuisine, typical slot | Private local street-and-number labels when available; otherwise "Home 1, 2, 3". All names can be edited in the browser. Demo streets are fictional. |
| The cost | Tiles for food, delivery fees, service fees, tips, discounts; average order value per year as a line | No judgement in the words |
| Next order | A sentence with the predicted day, time window and restaurant, three runner-up restaurants as a small ranked list, and the hit rate on your past orders | "Right 4 times out of 10 on your last 100 orders" |

## Typography

**Bricolage Grotesque** (variable, self-hosted through Fontsource) for headlines, numbers, the wordmark, buttons, labels and chart text. Its slightly irregular, market-sign shapes feel handmade without being cute, and its width and optical-size axes let the display numbers go big and tight. Big numbers use tight tracking (-0.03em) and tabular figures where they line up.

**Source Serif 4** (variable, self-hosted) for story prose and captions. It reads well at length and gives the story the voice of an essay, not a dashboard.

| Utility | Face | Size | Use |
| --- | --- | --- | --- |
| `text-display` | display 700 | clamp 44 to 84px | One per page: the story's opening line |
| `text-title` | display 600 | clamp 30 to 42px | Chapter titles |
| `text-heading` | display 600 | 22px | Panel and sheet titles |
| `text-lede` | serif | 22px | The sentence under a chapter title that states the finding |
| `text-body` | serif | 18px, line height 1.6 | Story prose, at most 68 characters a line |
| `text-ui` | display | 15px | Buttons, inputs, menus, table cells |
| `text-small` | display | 14px | Captions under figures, table meta |
| `text-tick` | display | 13px, tabular | Axis ticks only; the smallest size anywhere |
| `text-stat` | display 600 | clamp 32 to 44px, tabular | The number in a stat tile |

The wordmark is "munch" in lowercase Bricolage Grotesque at 700, with the plate's mark (a small circle with an amber arc at dinner time) before it.

## Spacing, radius, elevation

- A 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128. Chapters are separated by 128px on desktop and 96px on phones.
- Radius: `sm` 6px (chips, cells), `md` 10px (inputs, menu items), `lg` 16px (panels, sheets, dialogs), `full` (buttons, pills, segmented controls). The plate is a circle.
- One shadow, `shadow-lift`, for things that float: menus, sheets, dialogs, tooltips. Panels have no shadow; a hairline or the `raised` ground does the work.
- Controls are 40px tall, with at least a 44px pressable area.

## Layout and navigation

```
┌───────────────────────────────────────────────────────────────┐
│ ◐ munch      Story  Orders  Places     [All time ▾] [Demo]  ◑ │  top bar, sticky, bg-deep
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1,284 orders since                 ╭──────────────╮          │
│  March 2017.                       │   · ·:::··    │  the plate│
│                                    │ ··  :::::  ·  │          │
│  Lede sentence in serif,           │  · ·::·  ·    │          │
│  stating the biggest pattern.       ╰──────────────╯          │
│                                                               │
│  Chapter title                                                │
│  Lede with the finding.                                       │
│  ┌─────────────── figure, up to 64rem ───────────────┐        │
│  └───────────────────────────────────────────────────┘        │
│  Caption · Show the numbers                                   │
└───────────────────────────────────────────────────────────────┘
```

- **Story (`/`)**: one left-aligned column. Prose is at most 38rem wide; figures may run to 64rem; the page is at most 76rem, with the gutter from the tokens. On phones the plate comes first and the headline under it.
- **Orders (`/orders`)**: the explorer. A searchable, sortable, filterable table of every order (date, restaurant, items, total, delivery or pickup, group). Filters sit in one row above it. A row opens the order in a sheet from the right (`?order=`), with its items, fees and where it sits in your history ("Your 12th order from this place").
- **Places (`/places`)**: every restaurant you have ordered from, ranked, with search. A restaurant opens in a sheet (`?place=`) with its lifetime strip, your usual order, typical slot and every order.
- **The filter** in the top bar (All time, a year, or a home) applies to all three pages and lives in the URL (`?year=2023`, `?home=2`), so any view can be shared with yourself and the back button works.
- **The data badge** says where the data came from: "Demo" (the made-up person) or "Your orders, updated 3 Nov". Pressing it opens a small menu to switch or to load a file.
- **Start (`/start`)**: shown when no data is loaded. The plate drawn faintly, one sentence about Munch, two actions: "See the demo" and "Open my orders.json", a short "How do I get my orders?" pointing at the CLI, and the privacy line.

## Components

The components are shadcn/ui's (Radix underneath), added with the shadcn CLI into `web/src/components/ui` and restyled with the tokens. Never hand-copy a component, never add a second component library. Check the shadcn docs for a component before using it. Where shadcn's defaults and this document disagree, this document wins.

- **Button**: a pill. Variants: `primary` (amber fill, accent-fg text), `secondary` (surface with a strong hairline), `ghost` (accent-ink text), `link`. A button says what happens.
- **Select, DropdownMenu, Popover, Command**: the top-bar filter is a Select; the data badge is a DropdownMenu; a long searchable list (restaurants) is a Combobox (Popover with Command).
- **ToggleGroup**: segmented choices such as Orders | Spend, and Auto | Light | Dark.
- **Table**: the explorer, with TanStack Table for sort, filter and search. Hairline rows, tabular numbers right-aligned, a sticky header. "/" focuses the search.
- **Sheet**: an order or a place, from the right on desktop and from the bottom on phones. Escape closes it and focus returns to the row.
- **Tooltip / HoverCard**: chart tooltips use a shared `ChartTooltip` built on the same surface and shadow, not Radix tooltips, so they follow the pointer.
- **Badge**: delivery or pickup, group, cancelled. Always a word.
- **Skeleton**: only while a file is being read. Analysis is synchronous and fast, so figures never show a spinner.
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
- `prefers-reduced-motion` removes the plate animation and all travel.

## Checks before a screen is accepted

1. Look at it in Light and Dark, at 375px and 1440px, with the demo data.
2. Every chart has a sentence above it that states its finding, a table view, and tooltips by mouse and keyboard.
3. No hex values in components; only tokens.
4. Nothing animates on load except the plate's first fill; reduced motion is respected.
5. Tab through it: every control shows its focus ring.
6. Read every button aloud: it says what will happen.
7. Screenshots use the demo person only.

## Open items

- Check that Bricolage Grotesque's tabular figures are good enough for table columns. If not, tables use Source Serif 4's tabular figures.
- The plate's exact radial mapping (linear in time, or by order count so busy years get more room) is decided with real data in hand.
