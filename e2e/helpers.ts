import { expect, type Locator, type Page } from "@playwright/test";

export const ENTRIES_KEY = "isitcanon/entries/v1";

/**
 * Loads the games app with an empty localStorage so no test inherits another's tracking state.
 *
 * `/games`, not `/`: the games app moved off the root when the site grew its three sections and
 * `/` became the landing page. Every spec in this suite is a games-app spec and reaches it here.
 */
export async function gotoClean(page: Page): Promise<void> {
  await page.goto("/games");
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, ENTRIES_KEY);
  // The entries store caches its snapshot in module scope; reload to pick up the cleared value.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await waitForHydration(page);
}

/**
 * The grid is server-rendered, so it is on screen before React attaches its handlers and any
 * event fired in that window is silently dropped. Type into the search box until the app
 * actually reacts, then clear it again.
 */
async function waitForHydration(page: Page): Promise<void> {
  const search = page.getByLabel("Search franchises", { exact: true });
  const emptyState = page.getByText("Nothing matches", { exact: false });

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

/** One entry in the left-hand franchise list. */
export function sidebarItem(page: Page, name: string | RegExp): Locator {
  return page.getByRole("navigation", { name: "Franchises" }).getByRole("button", { name });
}

/** Opens a franchise from the sidebar and waits for its table. */
export async function openFranchise(page: Page, name: string | RegExp): Promise<void> {
  await sidebarItem(page, name).first().click();
  await expect(page.getByRole("table")).toBeVisible();
}

/** Every rendered game row — excludes the header row and any storyline section row. */
export function gameRows(page: Page): Locator {
  return page.getByRole("row").filter({ has: page.getByRole("combobox", { name: /^Status — / }) });
}

/** The single row for one game title. */
export function rowFor(page: Page, title: string): Locator {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("combobox", { name: `Status — ${title}`, exact: true }) });
}

/**
 * The toolbar's "shown/total rows" readout. It counts the filtered set, not the rows currently
 * mounted, so assertions on it are immune to the table filling in behind the first paint.
 */
export function rowSummary(page: Page): Locator {
  return page.getByText(/rows · \d+ tracked/);
}

/** Opens a game's detail drawer from its row. */
export async function openDetail(page: Page, title: string): Promise<Locator> {
  await rowFor(page, title)
    .getByRole("button", { name: `Open details for ${title}` })
    .click();
  const drawer = page.getByRole("dialog", { name: `${title} details` });
  await expect(drawer).toBeVisible();
  return drawer;
}

export async function readEntries(page: Page): Promise<unknown> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), ENTRIES_KEY);
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(raw);
  return parsed;
}
