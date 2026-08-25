import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The production build, not `next dev`. The dev overlay renders a modal on
    // any console error and that modal sits on top of the app, so a single
    // warning anywhere turns every spec into a timeout.
    command: "npm run build && npx next start -p 3001",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
