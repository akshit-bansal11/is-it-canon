# Dev tasks

Work that was skipped, blocked, or deliberately deferred, with enough context to pick it up later.

## Open

| Item | Why deferred | How to pick it up |
| --- | --- | --- |
| Halo rows now mix "Included" with standalone prices | Enrichment took real ITAD standalone prices for Halo 3 (`$9.99`), ODST (`$4.99`), Halo 4 (`$9.99`) and Reach (`$9.99`), but Halo 2 has no ITAD listing so it still reads `Included`. Both are factually correct; together they read inconsistently on a tab whose Best version column says "The Master Chief Collection" throughout. | Editorial call, not a bug. Either accept per-game prices as the more useful view, or add a rule in `scripts/enrich-data.mjs` that leaves `msrp` alone when the recommended edition is a collection. |
| 3 games unmatched on IGDB | Principled refusals rather than bad matches: **Resident Evil 0** (IGDB lists the 2002 game as "Resident Evil Zero"), **The Last of Us Part I** (authored year 2013 is the original; IGDB's "Part I" is the 2022 remake), **God of War Ragnarök: Valhalla** (no IGDB entry at all). Their `igdb` block is `null` rather than guessed. | If you want them filled, add a per-game `igdbOverride` id map in the script and look those three up by hand. |
| Console rows get no ITAD price | ITAD aggregates PC storefronts only, and its lookup matches on title with no year to check against — a console row resolved to the wrong product (2005 `God of War` matched the 2018 PC reboot and got priced `$49.99`). Console rows now keep their authored `msrp` by design. | Would need a per-platform price source (PS Store / Xbox APIs). Not free, not worth it for a personal tracker. |
| `historicalLow` only where ITAD has a listing | 36 of 72 games have one — the rest are console-only or absent from ITAD. | Nothing to do; it is a data-availability limit, not a code gap. |
| Pre-hydration dead window | The table is server-rendered and visible before React attaches handlers; a `selectOption` fired in that window is silently dropped. The E2E helper works around it by waiting for the app to react. | Real but low-impact at dev-server scale. If it ever matters, disable the row controls until hydration completes, or render them from a client boundary that shows a pending state. |
| E2E runs Chromium only | Firefox/WebKit projects would triple the runtime for a personal project with no cross-browser bug history. | Add projects to `playwright.config.ts` when there is a reason to. |
| No CI | Nothing runs the gate on push yet. | A GitHub Actions workflow running `npm run check` plus `npm run test:e2e` would cover it; the config already gates `forbidOnly`/`retries` on `process.env.CI`. |
| Auto-refresh has a 30-minute freshness guard | You asked for a refresh on every open. Literally every open re-hammers ITAD and earns a 429 that wipes out the prices you already had, so the open-time refresh skips when the cache is under 30 minutes old. | If you want a true every-open refresh, set `PRICE_TTL_MS` to `0` in `src/utils/canon/price-freshness.ts`. The manual button already bypasses the guard. |

## Resolved

| Item | Why deferred | How it was picked up |
| --- | --- | --- |
| ITAD API key not supplied | No key was available, so the live fetch path was written but never exercised. | Key added to `.env.local` and to Vercel (Production + Preview, stored Sensitive). The enrichment run exercised `games/lookup/v1` and `games/prices/v3` for real — 69/72 matched, 36 priced, 0 API failures. |
| Fetched prices are not cached | Prices were held in React state and cleared on reload. | `src/utils/canon/prices-store.ts` caches them under `isitcanon/prices/v1` and renders instantly on load; a background refresh fires once per page open. 10 tests cover the store's validation. |
| Playwright / a11y E2E | No browser binaries and no harness. | Chromium installed; `playwright.config.ts` plus 5 specs (table, tracking, filters, editions, a11y) — **15 tests passing**, verified stable over `--repeat-each=3`. |
| Component-level tests | Vitest was Node-only. | Vitest 4 `projects`: `unit` (node) and `components` (happy-dom + React plugin). **70 tests across 10 files.** |
| WCAG contrast failure | Found by the new axe specs: `--tone-faint` was 3.36:1 (light) and 3.88:1 (dark), both under AA's 4.5:1, across ~30 nodes. | Retuned to `#737373` / `#808080`, checked against every background the token actually sits on (canvas and hover surface), not just the canvas. Axe now reports **zero** WCAG A/AA violations in both themes. |
| Theme toggle label desync | The theme store cached one DOM read at hydration; if `public/theme.js` landed late that cache was permanently wrong and the button's accessible name lied. | `getThemeSnapshot()` now reads `data-theme` fresh on every call, and `subscribeTheme` attaches a `MutationObserver` so any external change re-renders. Reproduced the race in-browser and confirmed the fix. |
| `ToolbarActions` timer leak + silent confirm | Component tests surfaced three defects: `setTimeout`s never cleared on unmount, the armed confirm state stranding on a disabled button, and the two-step wipe being silent to screen readers. | Timers tracked in a ref and cleared on unmount; armed derived as `armed && tracked > 0`; an `aria-live="polite"` region announces the armed state. |
| Dataset provenance | Prices, runtimes and years were model-authored estimates. | `scripts/enrich-data.mjs` pulls from ITAD + IGDB for all 72 games. 62 display fields corrected — runtimes were the big one (Arkham Knight 16→39h, AC Valhalla 60→110h). Originals preserved in each game's `authored` block. |
| Unneeded ITAD OAuth credentials | `ITAD_CLIENT_ID` / `ITAD_CLIENT_SECRET` were added to `.env.local` but are only needed for user-scoped ITAD endpoints (collection, waitlist); the plain API key covers lookup and prices. | Removed from `.env.local`; never added to Vercel. |
