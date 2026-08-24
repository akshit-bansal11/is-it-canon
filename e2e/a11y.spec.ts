import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { gotoClean } from "./helpers";

const WCAG_TAGS = ["wcag2a", "wcag2aa"];

/** Violations reduced to rule id + offending selectors, so a failure report names the defect. */
async function scan(page: Page): Promise<{ id: string; targets: string[] }[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

const appliedTheme = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? "");

/**
 * Flips the theme with the toolbar toggle and returns the theme now applied.
 *
 * Reads `<html data-theme>` rather than the button label so the helper asserts the applied
 * theme independently of the label the label-honesty test below is checking.
 */
async function toggleTheme(page: Page): Promise<string> {
  const before = await appliedTheme(page);
  await page.getByRole("button", { name: /^Switch to/ }).click();
  await page.waitForFunction(
    (previous) => document.documentElement.dataset.theme !== previous,
    before,
  );
  return appliedTheme(page);
}

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

test("the applied theme has no WCAG A/AA violations", async ({ page }) => {
  expect(await scan(page)).toEqual([]);

  const flipped = await toggleTheme(page);
  expect(["light", "dark"]).toContain(flipped);
  expect(await scan(page)).toEqual([]);
});

test("the theme toggle label matches the applied theme", async ({ page }) => {
  const toggle = page.getByRole("button", { name: /^Switch to/ });
  const opposite = (await appliedTheme(page)) === "dark" ? "light" : "dark";
  await expect(toggle).toHaveAccessibleName(`Switch to ${opposite} theme`);
});
