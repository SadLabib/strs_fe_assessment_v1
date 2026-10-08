import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Every test talks to the same real database, so they run one at a time.
  // Determinism matters more than speed here.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Artifacts for debugging failures: open them with `npm run test:e2e:report`.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A production build: what reviewers run, without dev-only overlays.
    command: `npm run build && npm run start -- -p ${PORT}`,
    // Wait for the port, not a page: every page needs the API, which the
    // global setup only starts after the server is up.
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { API_BASE_URL: API_URL },
    stdout: "ignore",
    stderr: "pipe",
  },
});
