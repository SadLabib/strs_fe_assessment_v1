import { test as base, expect } from "@playwright/test";

import { DashboardPage } from "../pages/dashboard.page";
import { ResultsPage } from "../pages/results.page";
import { WorkspacePage } from "../pages/workspace.page";
import { TrainingApi } from "./api";

/** A 1×1 PNG, served instead of the listing photos (which come from the internet). */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

type Fixtures = {
  api: TrainingApi;
  dashboard: DashboardPage;
  workspace: WorkspacePage;
  results: ResultsPage;
  offlineImages: void;
};

export const test = base.extend<Fixtures>({
  // Runs for every test: no test should depend on picsum.photos being reachable.
  offlineImages: [
    async ({ page }, use) => {
      await page.route("**/_next/image**", (route) =>
        route.fulfill({ contentType: "image/png", body: PIXEL }),
      );
      await use();
    },
    { auto: true },
  ],
  api: async ({ request }, use) => use(new TrainingApi(request)),
  dashboard: async ({ page }, use) => use(new DashboardPage(page)),
  workspace: async ({ page }, use) => use(new WorkspacePage(page)),
  results: async ({ page }, use) => use(new ResultsPage(page)),
});

export { expect };
