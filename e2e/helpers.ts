import { expect, type Locator, type Page } from "@playwright/test";

export const ENTRIES_KEY = "isitcanon/entries/v1";

/** Loads the app with an empty localStorage so no test inherits another's tracking state. */
export async function gotoClean(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, ENTRIES_KEY);
  // The entries store caches its snapshot in module scope; reload to pick up the cleared value.
  await page.reload();
  await expect(page.getByRole("table")).toBeVisible();
  await waitForHydration(page);
}

/**
 * The table is server-rendered, so it is on screen before React attaches its handlers and any
 * event fired in that window is silently dropped. Re-type into the search box until the app
 * actually reacts, then clear it again.
 */
async function waitForHydration(page: Page): Promise<void> {
  const search = page.getByLabel("Search games");
  const emptyState = page.getByText("No rows match the current filters.");

  await expect
    .poll(
      async () => {
        await search.fill("__hydration-probe__");
        return emptyState.count();
      },
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);

  await search.fill("");
  await expect(emptyState).toHaveCount(0);
}

/** Every rendered game row — excludes the header row and the franchise caveat row. */
export function gameRows(page: Page): Locator {
  return page.getByRole("row").filter({ has: page.getByRole("combobox", { name: /^Status — / }) });
}

/** The single row for one game title. */
export function rowFor(page: Page, title: string): Locator {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("combobox", { name: `Status — ${title}`, exact: true }) });
}

export function franchiseTab(page: Page, name: RegExp): Locator {
  return page.getByRole("navigation", { name: "Franchises" }).getByRole("button", { name });
}

export async function readEntries(page: Page): Promise<unknown> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), ENTRIES_KEY);
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(raw);
  return parsed;
}
