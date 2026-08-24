# isitcanon

A canon-order tracker for game franchises. It lists 12 franchises and 72 mainline games, each franchise sorted by in-universe chronology rather than release order. The whole app is a single page: one spreadsheet-like table with a franchise tab bar and a filter row above it. Every row carries three fields you set yourself — play status, the device you play it on, and the store you own it from — all held in the browser.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4
- Biome (format + lint), ESLint (flat config), Stylelint
- Vitest

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run format` | Biome format, writes in place |
| `npm run imports` | Biome import organization, writes in place |
| `npm run lint:js` | Biome lint + ESLint, zero warnings allowed |
| `npm run lint:js:fix` | Same, autofixing what it can |
| `npm run lint:css` | Stylelint over all CSS |
| `npm run lint:css:fix` | Same, autofixing what it can |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest, single run (unit + component) |
| `npm run test:e2e` | Playwright end-to-end suite |
| `npm run test:e2e:ui` | Playwright in UI mode |
| `npm run data:enrich` | Repopulate the dataset from ITAD + IGDB |
| `npm run check` | format, lint:js, lint:css, typecheck, test in sequence |

## Layout

```txt
src/
├── app/
│   ├── api/prices/      # ITAD price lookup route handler
│   ├── globals.css      # monochrome token spine, both themes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── canon/           # app shell, tab bar, filter row, table, row, cells
├── constants/
│   └── canon/           # columns, statuses, devices, storefronts, tiers, filters
├── data/
│   ├── franchises.json  # the dataset
│   └── franchises.ts    # typed accessor over the JSON
├── hooks/
│   └── canon/           # tracked entries, theme, price fetching
├── types/
│   └── canon/           # franchise, game, table, user, price, theme types
└── utils/
    └── canon/           # pure helpers + the localStorage stores
e2e/                     # Playwright specs (table, tracking, filters, editions, a11y)
scripts/                 # enrich-data.mjs + its cache and report
```

## Data

`src/data/franchises.json` is the dataset — franchises, their games in chronological order, and each game's known alternate editions. Add entries by editing that file; it is typed as `Franchise[]` through `src/data/franchises.ts`, so a shape mistake fails `typecheck`. There is no backend and no database.

Three things are written to `localStorage`: your input (status, device and store per game, under `isitcanon/entries/v1`), the fetched price cache (`isitcanon/prices/v1`), and the theme choice (`isitcanon/theme/v1`). All are exposed through `useSyncExternalStore`, so two open tabs stay in sync. Clearing a game's status clears its device and store with it.

## Prices

`Update data` fetches current best prices from [IsThereAnyDeal](https://isthereanydeal.com) for the rows currently in view (up to 60). It needs an API key:

```sh
cp .env.example .env.local   # then fill in ITAD_API_KEY
```

Without the key the button reports that it is missing rather than failing silently.

Prices are cached in `localStorage` and rendered instantly on load, then refreshed in the background when the site is opened — but only if the cache has aged past `PRICE_TTL_MS` (30 minutes, in `src/utils/canon/price-freshness.ts`). Without that guard every reload fires a burst of lookups and earns a 429, which costs you the prices you already had. `Update data` ignores the guard and always refetches the rows in view.

The route throttles itself to 4 concurrent lookups and retries once on a 429 before reporting the rate limit to you, rather than returning an empty result that looks like "no prices found".

## Dataset enrichment

`npm run data:enrich` repopulates `src/data/franchises.json` from the live APIs — ITAD for prices and historical lows, IGDB for release years, ratings, genres and time-to-beat. It is idempotent, caches raw responses under `scripts/.cache/`, and writes a reviewable old-to-new diff to `scripts/enrich-report.md`. Hand-authored values are preserved under each game's `authored` block, so a re-run is always comparable. Pass `--refresh` to bypass the cache.
