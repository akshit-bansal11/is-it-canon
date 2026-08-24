import { expect, type Page, test } from "@playwright/test";
import { gotoClean, readEntries } from "./helpers";

const TITLE = "Half-Life: Alyx";
const GAME_ID = "hl-half-life-alyx";

const statusSelect = (page: Page) => page.getByLabel(`Status — ${TITLE}`, { exact: true });
const deviceSelect = (page: Page) => page.getByLabel(`Device — ${TITLE}`, { exact: true });
const storeSelect = (page: Page) => page.getByLabel(`Store — ${TITLE}`, { exact: true });

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("setting a status reveals the row's device and store selects", async ({ page }) => {
  await expect(statusSelect(page)).toHaveValue("");
  await expect(deviceSelect(page)).toHaveCount(0);
  await expect(storeSelect(page)).toHaveCount(0);

  await statusSelect(page).selectOption("playing");

  await expect(deviceSelect(page)).toBeVisible();
  await expect(storeSelect(page)).toBeVisible();
});

test("tracking survives a reload", async ({ page }) => {
  await statusSelect(page).selectOption("backlogged");
  await deviceSelect(page).selectOption("steam-deck");
  await storeSelect(page).selectOption("steam");

  await expect
    .poll(() => readEntries(page))
    .toEqual({ [GAME_ID]: { status: "backlogged", device: "steam-deck", storefront: "steam" } });

  await page.reload();

  await expect(statusSelect(page)).toHaveValue("backlogged");
  await expect(deviceSelect(page)).toHaveValue("steam-deck");
  await expect(storeSelect(page)).toHaveValue("steam");
});

test("clearing the status hides the extra selects and drops the stored entry", async ({ page }) => {
  await statusSelect(page).selectOption("completed");
  await deviceSelect(page).selectOption("pc");
  await expect
    .poll(() => readEntries(page))
    .toEqual({
      [GAME_ID]: { status: "completed", device: "pc" },
    });

  await statusSelect(page).selectOption("");

  await expect(deviceSelect(page)).toHaveCount(0);
  await expect(storeSelect(page)).toHaveCount(0);
  await expect.poll(() => readEntries(page)).toEqual({});
});
