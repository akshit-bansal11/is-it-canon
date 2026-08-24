import { expect, test } from "@playwright/test";
import { gotoClean, rowFor } from "./helpers";

const HALF_LIFE_EDITIONS = 4;

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("a game with alternate editions expands its disclosure", async ({ page }) => {
  const row = rowFor(page, "Half-Life");
  const disclosure = row.locator("details");

  await expect(disclosure).toHaveCount(1);
  await expect(disclosure).toHaveJSProperty("open", false);
  await expect(row.getByRole("listitem")).toHaveCount(0);

  await row.locator("summary").click();

  await expect(disclosure).toHaveJSProperty("open", true);
  await expect(row.getByRole("listitem")).toHaveCount(HALF_LIFE_EDITIONS);
  await expect(row.getByRole("listitem").first()).toBeVisible();
});

test("games without alternate editions render no disclosure", async ({ page }) => {
  await expect(rowFor(page, "Half-Life: Alyx").locator("details")).toHaveCount(0);
  await expect(rowFor(page, "Assassin’s Creed Unity").locator("details")).toHaveCount(0);
});
