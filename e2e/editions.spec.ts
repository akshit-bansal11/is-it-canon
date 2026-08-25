import { expect, test } from "@playwright/test";
import { gotoClean, openDetail, openFranchise } from "./helpers";

const HALF_LIFE_EDITIONS = 4;

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
  await openFranchise(page, /^Half-Life/);
});

test("a game's detail drawer lists its alternate editions", async ({ page }) => {
  const drawer = await openDetail(page, "Half-Life");

  await expect(drawer.getByRole("listitem")).toHaveCount(HALF_LIFE_EDITIONS);
  await expect(drawer.getByRole("listitem").first()).toBeVisible();
  await expect(drawer.getByText("Why here")).toBeVisible();
});

test("the drawer closes on Escape and returns the table", async ({ page }) => {
  const drawer = await openDetail(page, "Half-Life");

  await page.keyboard.press("Escape");

  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole("table")).toBeVisible();
});

test("a game with one release still opens a drawer, with no edition list", async ({ page }) => {
  const drawer = await openDetail(page, "Half-Life: Alyx");

  await expect(drawer.getByRole("listitem")).toHaveCount(0);
  await expect(drawer.getByText("Released")).toBeVisible();
});
