# 0001: orders.json, not SQLite

The normalised history is one JSON file, `data/orders.json`, validated by the zod schema in `core/schema.ts`.

A person's whole delivery history is a few thousand orders at most, a few megabytes as JSON. The web app has to load it in the browser anyway (from the dev server, or from a file the person drops in on the public page), and the analysis runs in memory in `core/`. SQLite would add a second format and a WebAssembly build to the browser for no gain. If a future source makes the history much larger, revisit this.

Raw responses stay as fetched in `data/raw/<source>/`, one file per page and per order, so the normaliser can be re-run without fetching again.
