# Dev tasks

Work that was skipped, blocked, or deliberately deferred, with enough context to pick it up later.

## Open

| Item | Why deferred | How to pick it up |
| --- | --- | --- |
| ITAD API key not supplied | `Update prices` calls the IsThereAnyDeal API, which requires a key. None was available in this environment, so the live fetch path is written but has never been exercised against the real API. | Register an app at `https://isthereanydeal.com/apps/my/`, put the key in `.env.local` as `ITAD_API_KEY`, restart `npm run dev`, then click `Update prices`. Verify the response shape in `src/app/api/prices/route.ts` (`games/lookup/v1` then `games/prices/v3`) still matches — the parser is defensive but the field names are from the v2 API docs, not a live response. |
| Fetched prices are not cached | You asked for only user-input columns to live in `localStorage`, so price quotes are held in React state and clear on reload. | If you want them to survive a reload, add a separate `isitcanon/prices/v1` key with a fetched-at timestamp and a TTL, written from `usePrices`. Deliberately not done — it is derived data, not your input. |
| Mobile verified by proxy, not on a device | `resize_window` did not change the browser's viewport in this environment, so the 390px layout was verified by constraining the app shell and measuring, not by rendering at a real phone viewport. | Open devtools device emulation at 390x844 and confirm: the tab bar, filter row and table each scroll horizontally on their own, the Game column stays pinned left, and no scrollbars are visible. |
| Playwright / a11y E2E | No browser binaries installed in this environment and no E2E harness set up. | `npm i -D @playwright/test @axe-core/playwright && npx playwright install`, then add smoke + axe specs for the table page. |
| Component-level tests | Vitest is configured for pure Node util tests only; React component tests need a DOM environment and testing-library. Only the pure utils (`parsePrice`, `sortEntries`, `filterEntries`) are covered — 21 tests. | Add `happy-dom`, `@testing-library/react` and `@vitejs/plugin-react`, then a separate vitest project for `*.test.tsx`. Highest-value targets: `entries-store` (status clear cascading to device/store) and `GameCell` disclosure. |
| Edition data is model knowledge, not sourced | The `editions` array on each game was authored from model knowledge with a handful of confirming web lookups, not scraped from a canonical source. 66 of 72 games have editions; the other 6 genuinely have none. | Spot-check anything you plan to buy on. The one value flagged as fuzzy is the year on Max Payne 3: Complete Edition. |
| Dataset provenance / refresh | MSRP, runtimes and "best version" notes are a point-in-time snapshot compiled 24 Aug 2026 and will drift. | Re-verify MSRP and platform availability before relying on them; the `Now` column plus an ITAD key is the live-price answer. |

## Resolved

| Item | Why deferred | How to pick it up |
| --- | --- | --- |
