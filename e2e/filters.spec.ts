import { expect, test } from "@playwright/test";
import { gameRows, gotoClean, openFranchise, rowSummary } from "./helpers";

const HALF_LIFE_GAMES = 7;

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
  await openFranchise(page, /^Half-Life/);
});

test("the search box narrows the rows to a title match", async ({ page }) => {
  // "Blue Shift" rather than "Alyx": the search also reads each row's notes, and
  // Alyx Vance is named in more than one of them.
  await page.getByLabel("Search games").fill("Blue Shift");

  await expect(gameRows(page)).toHaveCount(1);
  await expect(page.getByLabel("Status — Half-Life: Blue Shift", { exact: true })).toBeVisible();
});

test("the status filter separates tracked from untracked games", async ({ page }) => {
  const alyx = page.getByLabel("Status — Half-Life: Alyx", { exact: true });
  await alyx.selectOption("playing");

  await page.getByLabel("Filter by status").selectOption("none");
  await expect(rowSummary(page)).toContainText(`${HALF_LIFE_GAMES - 1}/${HALF_LIFE_GAMES} rows`);
  await expect(alyx).toHaveCount(0);

  await page.getByLabel("Filter by status").selectOption("playing");
  await expect(gameRows(page)).toHaveCount(1);
  await expect(alyx).toBeVisible();
});

test("Reset filters is disabled until a filter is active", async ({ page }) => {
  const reset = page.getByRole("button", { name: "Reset filters" });
  const search = page.getByLabel("Search games");

  await expect(reset).toBeDisabled();

  await search.fill("Blue Shift");
  await expect(reset).toBeEnabled();

  await reset.click();
  await expect(search).toHaveValue("");
  await expect(gameRows(page)).toHaveCount(HALF_LIFE_GAMES);
  await expect(reset).toBeDisabled();
});

test("two active filters are ANDed together", async ({ page }) => {
  await page.getByLabel("Search games").fill("Half-Life");
  await expect(gameRows(page)).toHaveCount(HALF_LIFE_GAMES);

  await page.getByLabel("Filter by skip tier").selectOption("opt");

  await expect(gameRows(page)).toHaveCount(1);
  await expect(
    page.getByLabel("Status — Half-Life: Opposing Force", { exact: true }),
  ).toBeVisible();
});

test("an empty result offers a way back out", async ({ page }) => {
  await page.getByLabel("Search games").fill("no-such-game");

  const empty = page.getByText("No game matches the current filters.");
  await expect(empty).toBeVisible();

  await page.getByRole("button", { name: "Reset filters" }).first().click();
  await expect(gameRows(page)).toHaveCount(HALF_LIFE_GAMES);
});
