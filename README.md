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
| `npm run test` | Vitest, single run |
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
    └── canon/           # pure helpers + the two external stores
```

## Data

`src/data/franchises.json` is the dataset — franchises, their games in chronological order, and each game's known alternate editions. Add entries by editing that file; it is typed as `Franchise[]` through `src/data/franchises.ts`, so a shape mistake fails `typecheck`. There is no backend and no database.

The only thing written to `localStorage` is your own input — status, device and store per game, under `isitcanon/entries/v1`, plus the theme choice under `isitcanon/theme/v1`. Both stores are exposed through `useSyncExternalStore`, so two open tabs stay in sync. Clearing a game's status clears its device and store with it.

## Prices

`Update prices` fetches current best prices from [IsThereAnyDeal](https://isthereanydeal.com) for the rows currently in view (up to 60). It needs an API key:

```sh
cp .env.example .env.local   # then fill in ITAD_API_KEY
```

Without the key the button reports that it is missing rather than failing silently. Fetched prices live in memory only — they are not cached to `localStorage`, so they clear on reload.
