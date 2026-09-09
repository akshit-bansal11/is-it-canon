# isitcanon

A canon-order tracker for game franchises. It lists 126 franchises and 690 games, each franchise sorted by in-universe chronology rather than release order. Every franchise here has at least two games sharing one storyline; the ones that split into separate storylines — Assassin's Creed, Zelda's branching timeline, Mega Man's far-future chain — declare those splits and the table breaks into sections for them.

The front door is a grid of every franchise. Pick one and you get its table: one row per game, in story order, with three fields you set yourself — play status, the device you play it on, and the store you own it from — all held in the browser. A searchable sidebar switches franchises, `Cmd/Ctrl K` jumps straight to any series or game, and clicking a game title opens a detail panel with its editions and notes.

The current view lives in the URL (`#/witcher`, `#/ac/desmond`), so a reload keeps your place and a link points at one series.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4
- Convex (canon dataset + server functions)
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
| `npm run test:e2e` | Playwright end-to-end suite (builds and serves production) |
| `npm run test:e2e:ui` | Playwright in UI mode |
| `npm run data:enrich` | Repopulate the dataset from ITAD + IGDB |
| `npm run data:check` | Structural checks over the dataset (ids, ordering, arcs) |
| `npm run check` | format, lint:js, lint:css, typecheck, data:check, test in sequence |

## Layout

```txt
src/
├── app/
│   ├── api/prices/      # ITAD price lookup route handler
│   ├── globals.css      # monochrome token spine, motion scale, both themes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── canon/           # shell, sidebar, grid, table, drawer, palette, cells
├── constants/
│   └── canon/           # columns, statuses, devices, storefronts, tiers, filters, motion
├── data/
│   └── franchises.json  # authored snapshot; seeds Convex, not read at runtime
├── hooks/
│   └── canon/           # tracked entries, theme, prices, hotkeys, chunked rendering
├── lib/
│   └── db/              # Convex server client for cached server-component reads
├── types/
│   └── canon/           # franchise, game, arc, table, user, price, theme, view types
└── utils/
    └── canon/           # pure helpers + the localStorage stores
convex/                  # schema, the canon read query, seed and integrity checks
e2e/                     # Playwright specs (table, tracking, filters, editions, a11y)
scripts/                 # enrich-data.mjs, check-data.mjs, cache and report
```

## Data

The dataset — 126 franchises, 690 games, 104 storylines — lives in **Convex**. `convex/schema.ts` defines its shape and is the validator; `convex/canon.ts` exposes the single read query the app uses.

`src/data/franchises.json` is the authored snapshot it was seeded from, and is still what `npm run data:check` and the enrichment scripts operate on. It is **not** what the app reads. To load it into a deployment:

```bash
npx convex run seed:run          # dev
npx convex run seed:run --prod   # production
```

That is an `internalMutation`, so only the deployer can call it — the deployment URL ships in the client bundle by design, and a public mutation that replaced the dataset would be an unauthenticated wipe. It replaces rather than merges, because the JSON is a complete snapshot.

`npm run data:check` validates the JSON for what types cannot catch: duplicate ids, an `order` that skips a number, a game naming an arc its franchise never declared, a storyline split into non-adjacent blocks. `npx convex run data:counts` asserts the same totals against the database, plus orphaned franchise and arc references. The two agreeing is what proves a seed landed intact.

A franchise may declare `arcs` — named storylines that stand alone within it. Every game then carries an `arc` matching one of them, and the games of each arc sit together in the ordering. Franchises that tell one continuous story simply omit both fields.

The home page is a server component that reads Convex at build time and revalidates hourly, so the dataset is editable without a redeploy while the page stays statically generated. Filtering, sorting and search all still run on the client against the full dataset — that is what keeps the table instant, and it is why the read query returns everything rather than paginating.

Three things are written to `localStorage`: your input (status, device and store per game, under `isitcanon/entries/v1`), the fetched price cache (`isitcanon/prices/v1`), and the theme choice (`isitcanon/theme/v1`). All are exposed through `useSyncExternalStore`, so two open tabs stay in sync. Clearing a game's status clears its device and store with it.

## Deployment

Vercel, building through Convex so that the schema and functions deploy alongside the app:

```
buildCommand: npx convex deploy --cmd 'npm run build'
```

That is set in `vercel.json`. It requires **`CONVEX_DEPLOY_KEY`** in the Vercel project's environment variables, generated from the Convex dashboard under the production deployment. `npx convex deploy` sets `NEXT_PUBLIC_CONVEX_URL` for the build itself, so that one does not need setting by hand.

`ITAD_API_KEY` is needed at runtime for the price route.

## Keyboard

| Key | Does |
| --- | --- |
| `Cmd/Ctrl K` | Jump to any franchise or game |
| `/` | Focus the franchise filter |
| `[` / `]` | Previous / next franchise |
| `G` | Back to the franchise grid |
| `Esc` | Close an overlay, or clear the filter |
| `?` | Show the shortcut list |

## Motion

Durations, easings and a radius scale live as custom properties in `globals.css`. Every duration is `calc(<ms> * var(--motion-scale))`, and `prefers-reduced-motion` sets that scale to `0` — one switch turns off every entrance, stagger and transition without an `!important` reset anywhere. The two looping animations (the pulse and the skeleton sweep) are switched off explicitly in the same query, since a zero-duration infinite animation is not the same as a stopped one.

Long lists arrive in chunks of 60 rather than in one commit, so a 690-row table paints immediately and the entrance animations do not stutter. Only the first two dozen rows carry a stagger delay.

## Prices

`Update data` fetches current best prices from [IsThereAnyDeal](https://isthereanydeal.com) for the rows currently in view (up to 60). It needs an API key:

```sh
cp .env.example .env.local   # then fill in ITAD_API_KEY
```

Without the key the button reports that it is missing rather than failing silently.

Prices are cached in `localStorage` and rendered instantly on load, then refreshed in the background when the site is opened — but only if the cache has aged past `PRICE_TTL_MS` (30 minutes, in `src/utils/canon/price-freshness.ts`). Without that guard every reload fires a burst of lookups and earns a 429, which costs you the prices you already had. `Update data` ignores the guard and always refetches the rows in view.

The route throttles itself to 4 concurrent lookups and retries once on a 429 before reporting the rate limit to you, rather than returning an empty result that looks like "no prices found".

## Dataset enrichment

Only the original 12 franchises (72 games) have been through enrichment. The 114 franchises added in v2 carry hand-authored years, lengths and prices with no `sources`/`market`/`igdb` block — accurate to the best of the author's knowledge, but not API-verified. A full re-run over 690 games has not been attempted; see `DEV-TASKS.md`.

`npm run data:enrich` repopulates `src/data/franchises.json` from the live APIs — ITAD for prices and historical lows, IGDB for release years, ratings, genres and time-to-beat. It is idempotent, caches raw responses under `scripts/.cache/`, and writes a reviewable old-to-new diff to `scripts/enrich-report.md`. Hand-authored values are preserved under each game's `authored` block, so a re-run is always comparable. Pass `--refresh` to bypass the cache.
