import { expect, test } from "@playwright/test";

/** Well clear of any rounding between viewport height and document height. */
const OVERFLOW_MARGIN = 200;

/**
 * The one thing about this page that no unit test can see.
 *
 * `globals.css` once carried `html, body { overflow: hidden }` as a base reset — correct for the
 * games app, which is a fixed `h-dvh` frame with its own internal scrollers, and fatal for every
 * ordinary document-flow page. The MCU chronology is the tallest of them at 97 entries, so it
 * rendered its overflow with no way to reach it. Nothing in the component tree was wrong, which
 * is precisely why the unit suite stayed green through it.
 */
test("a chronology taller than the viewport scrolls", async ({ page }) => {
  await page.goto("/screen/mcu");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Assert the page really does overflow first. Without this the scroll assertion below would
  // pass vacuously the day someone shortens the dataset.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(overflow).toBeGreaterThan(OVERFLOW_MARGIN);

  await page.mouse.wheel(0, 1000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
