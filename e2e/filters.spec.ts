import { expect, test } from "@playwright/test";
import { gameRows, gotoClean } from "./helpers";

const TOTAL_GAMES = 72;

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("the search box narrows the rows to a title match", async ({ page }) => {
  await page.getByLabel("Search games").fill("Arkham Knight");

  await expect(gameRows(page)).toHaveCount(1);
  await expect(page.getByLabel("Status — Batman: Arkham Knight", { exact: true })).toBeVisible();
});

test("the status filter separates tracked from untracked games", async ({ page }) => {
  const alyx = page.getByLabel("Status — Half-Life: Alyx", { exact: true });
  await alyx.selectOption("playing");

  await page.getByLabel("Filter by status").selectOption("none");
  await expect(gameRows(page)).toHaveCount(TOTAL_GAMES - 1);
  await expect(alyx).toHaveCount(0);

  await page.getByLabel("Filter by status").selectOption("playing");
  await expect(gameRows(page)).toHaveCount(1);
  await expect(alyx).toBeVisible();
});

test("Reset filters is disabled until a filter is active", async ({ page }) => {
  const reset = page.getByRole("button", { name: "Reset filters" });
  const search = page.getByLabel("Search games");

  await expect(reset).toBeDisabled();

  await search.fill("Arkham");
  await expect(reset).toBeEnabled();

  await reset.click();
  await expect(search).toHaveValue("");
  await expect(gameRows(page)).toHaveCount(TOTAL_GAMES);
  await expect(reset).toBeDisabled();
});

test("two active filters are ANDed together", async ({ page }) => {
  await page.getByLabel("Search games").fill("Half-Life");
  await expect(gameRows(page)).toHaveCount(7);

  await page.getByLabel("Filter by skip tier").selectOption("opt");

  await expect(gameRows(page)).toHaveCount(1);
  await expect(
    page.getByLabel("Status — Half-Life: Opposing Force", { exact: true }),
  ).toBeVisible();
});
