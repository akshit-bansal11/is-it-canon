import { expect, test } from "@playwright/test";
import { gameRows, gotoClean, openFranchise, rowSummary, sidebarItem } from "./helpers";

const HALF_LIFE_GAMES = 7;
// Franchise-tab column order: #, Game, Status, Device, Store, Year, …
const GAME_CELL = 1;
const YEAR_CELL = 5;

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("the front door is a franchise grid, not a table", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("story order");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(sidebarItem(page, /^All franchises/)).toBeVisible();
});

test("opening a franchise from the sidebar shows only its games", async ({ page }) => {
  await openFranchise(page, /^Half-Life/);

  await expect(page.getByRole("columnheader", { name: "Game" })).toBeVisible();
  await expect(gameRows(page)).toHaveCount(HALF_LIFE_GAMES);
  await expect(rowSummary(page)).toContainText(`${HALF_LIFE_GAMES} rows`);
});

test("a franchise with storylines breaks its table into sections", async ({ page }) => {
  await openFranchise(page, /^Assassin/);

  const table = page.getByRole("table");
  await expect(table.getByText("The Desmond Saga")).toBeVisible();
  await expect(table.getByText("The Kenway Line")).toBeVisible();
  await expect(table.getByText("4 games").first()).toBeVisible();
});

test("a storyline chip narrows the table to that arc", async ({ page }) => {
  await openFranchise(page, /^Assassin/);

  const before = await gameRows(page).count();
  await page.getByRole("button", { name: /^The Desmond Saga/ }).click();

  const after = await gameRows(page).count();
  expect(after).toBeLessThan(before);
  await expect(page.getByRole("button", { name: /^The Desmond Saga/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the Year header sorts the rows and flips aria-sort", async ({ page }) => {
  await openFranchise(page, /^Half-Life/);

  const header = page.getByRole("columnheader", { name: "Year" });
  const firstYear = gameRows(page).first().getByRole("cell").nth(YEAR_CELL);

  await expect(header).toHaveAttribute("aria-sort", "none");

  await header.getByRole("button").click();
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(firstYear).toHaveText("1998");

  await header.getByRole("button").click();
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect(firstYear).toHaveText("2020");
});

test("the Game cell stays pinned when the table scrolls horizontally", async ({ page }) => {
  await openFranchise(page, /^Half-Life/);

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
