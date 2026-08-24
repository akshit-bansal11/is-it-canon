import { expect, test } from "@playwright/test";
import { franchiseTab, gameRows, gotoClean } from "./helpers";

const TOTAL_GAMES = 72;
const HALF_LIFE_GAMES = 7;
// All-tab column order: Series, #, Game, Status, Device, Store, Year, …
const GAME_CELL = 2;
const YEAR_CELL = 6;

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("renders every game on the All tab", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Franchises" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Game" })).toBeVisible();
  await expect(gameRows(page)).toHaveCount(TOTAL_GAMES);
});

test("a franchise tab narrows the rows and marks itself pressed", async ({ page }) => {
  const all = franchiseTab(page, /^All/);
  const halfLife = franchiseTab(page, /^Half-Life/);

  await expect(all).toHaveAttribute("aria-pressed", "true");

  await halfLife.click();

  await expect(halfLife).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(gameRows(page)).toHaveCount(HALF_LIFE_GAMES);
});

test("the Year header sorts the rows and flips aria-sort", async ({ page }) => {
  const header = page.getByRole("columnheader", { name: "Year" });
  const firstYear = gameRows(page).first().getByRole("cell").nth(YEAR_CELL);

  await expect(header).toHaveAttribute("aria-sort", "none");

  await header.getByRole("button").click();
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(firstYear).toHaveText("1996");

  await header.getByRole("button").click();
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect(firstYear).toHaveText("2026");
});

test("the Game cell stays pinned when the table scrolls horizontally", async ({ page }) => {
  const scroller = page.getByRole("table").locator("xpath=..");
  const firstRow = gameRows(page).first();
  const gameCell = firstRow.getByRole("cell").nth(GAME_CELL);
  const yearCell = firstRow.getByRole("cell").nth(YEAR_CELL);

  const scrollTo = async (fraction: number) =>
    scroller.evaluate((element, value) => {
      element.scrollLeft = (element.scrollWidth - element.clientWidth) * value;
      return element.scrollLeft;
    }, fraction);

  const boxes = async () => {
    const game = await gameCell.boundingBox();
    const year = await yearCell.boundingBox();
    if (game === null || year === null) throw new Error("table cells are not rendered");
    return { game, year };
  };

  const nearScroll = await scrollTo(0.4);
  const near = await boxes();

  const farScroll = await scrollTo(1);
  const far = await boxes();

  expect(nearScroll).toBeGreaterThan(0);
  expect(farScroll).toBeGreaterThan(nearScroll + 100);

  // The Game cell is pinned to the scroll container's left edge; the Year cell is not.
  expect(Math.abs(far.game.x - near.game.x)).toBeLessThan(2);
  expect(far.year.x).toBeLessThan(near.year.x - 100);
});
