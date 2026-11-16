import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// The admin tests sign in with the test admin from .env.local (or CI secrets).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const port = 3100;
const baseURL = `http://localhost:${port}`;

/** Runs against the production build: `npm run build` first, then `npm run test:e2e`. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry", locale: "id-ID", timezoneId: "Asia/Jakarta" },
  projects: [
    {
      // The size the site is designed for first: a small mid-range Android phone.
      name: "mobile-360",
      use: { browserName: "chromium", viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
      testIgnore: /admin\.spec\.ts/,
    },
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
      testIgnore: /admin\.spec\.ts/,
    },
    {
      // Admin tests change shared data and put it back. They run once, on a phone
      // viewport, after the public tests have finished, so nothing else is reading
      // the data they are changing.
      name: "admin-mobile-360",
      use: { browserName: "chromium", viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
      testMatch: /admin\.spec\.ts/,
      dependencies: ["mobile-360", "desktop"],
      timeout: 90_000,
      // These tests wait on real writes to the remote database, which can take a
      // few seconds on the free plan; 5 s (the default) made them flaky.
      expect: { timeout: 15_000 },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
