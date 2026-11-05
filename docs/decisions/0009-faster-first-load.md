# 0009: a faster first load

The public site felt slow on phones (Lighthouse mobile: 84, largest paint 3.2s). The animations stay; what changed is what loads first and how long things wait.

- **Pages are their own chunks.** `main.tsx` loads the home page, the orders and the places with `React.lazy` inside `Ready`, so the start page never downloads the charts, the table or motion. The three tickets beside the invitation load after the words (`routes/start-preview.tsx`), and the tickets themselves live in `story/tickets.tsx`, apart from the rail, so they don't bring motion with them. If a tab open across a deploy asks for a chunk that is gone, the page reloads once.
- **Entrances start sooner.** No entrance waits more than about 150ms, and staggers are tighter. The choreography is the same.
- **Hashed files are cached for a year.** `_headers` is copied to `dist/` by `build:site` and marks `/munch/assets/*` immutable. Everything else, `index.html` included, still revalidates. A missing file under `/munch/assets/` falls back to `index.html` like any other path and gets the same long cache; with hashed names that only matters if a deploy is rolled back while someone has the old page open.
- **Screenshots are WebP at about twice their shown size** (1440 wide for the wide one, 1080 for the others), with their width and height set. Every browser Munch targets reads WebP, so there is no `<picture>`.
- **The two fonts above the fold are preloaded** from `index.html`. In `bun run dev` those links point nowhere and the browser warns that a preload went unused; the built site is what they are for.
